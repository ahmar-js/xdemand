from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import pandas as pd
import json, os

app = Flask(__name__)
CORS(app)  # allow all origins
OUTPUT_FILE = 'aggregated_kpis.csv'
FIELD_MAP = {
    'category':  'Linn_Category',
    'channel':   'Channel',
    'sku':       'im_sku',
    'warehouse': 'warehouse_code',
    'company':   'Company',
    'region':    'Region',
}    


@app.route('/csv-to-json', methods=['GET'])
def csv_to_json():
    try:
        # 1) Read your CSV
        df = pd.read_csv('data_for_dash.csv', low_memory=False)

        # 2) Filter to the two SKUs you care about
        df = df[df['im_sku'].isin(['3PBR-F6MB-5FT', 'BGR-F6MB-14OZ'])]

        # 3) Drop any "Unnamed:" index column
        df = df.drop(columns=[c for c in df.columns if c.startswith('Unnamed')], errors='ignore')

        # Debug: Count how many rows have out_of_stock values
        print(f"Total rows: {len(df)}")
        print(f"Rows with out_of_stock=NaN: {df['out_of_stock'].isna().sum()}")
        print(f"Rows with out_of_stock=1: {(df['out_of_stock'] == 1).sum()}")
        print(f"Rows with out_of_stock=0: {(df['out_of_stock'] == 0).sum()}")
        
        # Debug: Show a few rows with out_of_stock=1 if they exist
        rows_with_out_of_stock = df[df['out_of_stock'] == 1].head(3)
        if not rows_with_out_of_stock.empty:
            print("Sample rows with out_of_stock=1:")
            print(rows_with_out_of_stock[['Date', 'im_sku', 'out_of_stock']])

        # 5) Convert the DataFrame into a list of dicts
        records = df.to_dict(orient='records')

        # 6) **Clean every record**: turn ANY pandas "na" into Python None
        clean = []
        for rec in records:
            for k, v in rec.items():
                if pd.isna(v):      # catches numpy.nan, pd.NA, pd.NaT, etc.
                    rec[k] = None
            clean.append(rec)

        # Add a response header for debugging
        response = Response(json.dumps(clean), mimetype='application/json')
        response.headers['X-Debug-OutOfStock-Count'] = str((df['out_of_stock'] == 1).sum())
        return response

    except Exception as e:
        err = {'error': str(e)}
        return Response(json.dumps(err), status=500, mimetype='application/json')
    


@app.route('/dynamic-filter', methods=['POST'])
def dynamic_filter():
    try:
        req = request.get_json(force=True)
        if not isinstance(req, dict):
            return Response(
                json.dumps({'error': 'Payload must be a JSON object'}),
                status=400, mimetype='application/json'
            )

        # build filters dict of {df_col: [values]}
        filters = {}
        for key, df_col in FIELD_MAP.items():
            raw = req.get(key, None)
            if raw is None: 
                continue
            # normalize to list
            if isinstance(raw, list):
                vals = [str(v).strip() for v in raw if str(v).strip()]
            else:
                vals = [s.strip() for s in str(raw).split(',') if s.strip()]
            if vals:
                filters[df_col] = vals

        if not filters:
            return Response(json.dumps({'error': 'Please select at least one filter'}),
                            status=400, mimetype='application/json')

        df = pd.read_csv('data_for_dash.csv', low_memory=False)

        df = df.drop(columns=[c for c in df.columns if c.startswith('Unnamed')], errors='ignore')

        # 6) Apply each filter that has a value
        for col, vals in filters.items():
            df = df[df[col].isin(vals)]

        records = df.to_dict(orient='records')

        # 6) **Clean every record**: turn ANY pandas "na" into Python None
        clean = []
        for rec in records:
            for k, v in rec.items():
                if pd.isna(v):      # catches numpy.nan, pd.NA, pd.NaT, etc.
                    rec[k] = None
            clean.append(rec)
        return jsonify(records)

    except Exception as e:
        return Response(
            json.dumps({'error': f'Internal server error: {str(e)}'}),
            status=500, mimetype='application/json'
        )
    
    
@app.route('/kpi-cards', methods=['POST'])
def kpi_cards():
    try:
        # 1) Parse & validate payload
        req = request.get_json(force=True)
        print("req", req)
        if not isinstance(req, dict):
            return Response(
                json.dumps({'error': 'Payload must be a JSON object'}),
                status=400, mimetype='application/json'
            )
        required = {
            'metric',
            'end_date',
            'im_sku',
            'revenue',
            'Quantity',
            'for_qty_yhat',
            'for_rev_yhat',
            'warehouse_code'
        }

        # 3) Find which ones are missing
        missing = required - set(req.keys())
        if missing:
            return Response(
                json.dumps({'error': f'Missing field(s): {", ".join(sorted(missing))}'}),
                status=400, mimetype='application/json'
            )
        metric        = str(req.get('metric', '')).strip()
        end_date_str  = str(req.get('end_date', '')).strip()
        if metric not in ('Quantity', 'revenue') or not end_date_str:
            return Response(
                json.dumps({'error': '"metric" must be "Quantity" or "revenue", and "end_date" is required'}),
                status=400, mimetype='application/json'
            )

        # detect whether actuals were supplied in the request
        actual_data_in_req = req.get(metric, None)
        
        # map to your dataframe columns
        if metric == 'Quantity':
            actual_col, forecast_col = 'Quantity', 'for_qty_yhat'
        else:
            actual_col, forecast_col = 'revenue',  'for_rev_yhat'
            
        print("actual col", actual_col)

        # 2) Load & prepare master data
        df = pd.read_csv('data_for_dash.csv', low_memory=False)
        df['Date'] = pd.to_datetime(df['Date'])
        # OPTIONAL: adjust or remove this SKU filter
        df = df[df['im_sku'].isin(['3PBR-F6MB-5FT','BGR-F6MB-14OZ'])]
        df.drop(columns=[c for c in df.columns if c.startswith('Unnamed')],
                errors='ignore', inplace=True)
        df.to_csv('df.csv', index=False)

        # coerce to numeric; keep NaN in actual_col so we can detect missing actuals
        df[actual_col]   = pd.to_numeric(df[actual_col],   errors='coerce')
        df[forecast_col] = pd.to_numeric(df[forecast_col], errors='coerce').fillna(0)

        # parse the end date
        end_dt = pd.to_datetime(end_date_str)

        # 3) Define sliding windows and "require_prev" logic
        periods = {
            'daily': {
                'start': end_dt,
                'end':   end_dt,
                'require_prev': False
            },
            'weekly': {
                'start':        end_dt - pd.Timedelta(days=6),
                'end':          end_dt,
                # only require two weeks if the caller did *not* send actual_data
                'require_prev': actual_data_in_req is None
            },
            'monthly': {
                'start':        (end_dt - pd.DateOffset(months=1)) + pd.Timedelta(days=1),
                'end':          end_dt,
                'require_prev': actual_data_in_req is None
            },
            'quarterly': {
                'start':        (end_dt - pd.DateOffset(months=3)) + pd.Timedelta(days=1),
                'end':          end_dt,
                'require_prev': actual_data_in_req is None
            },
        }

        # 4) KPI computation helper
        def compute_kpi(start_dt, end_dt, require_prev):
            span       = end_dt - start_dt
            mask_curr  = df['Date'].between(start_dt, end_dt)
            prev_start = start_dt - span - pd.Timedelta(days=1)
            prev_end   = start_dt - pd.Timedelta(days=1)
            mask_prev  = df['Date'].between(prev_start, prev_end)
            next_start = end_dt + pd.Timedelta(days=1)
            next_end   = next_start + span
            mask_next  = df['Date'].between(next_start, next_end)

            # if we need two periods but they're not there, bail
            if require_prev and (mask_prev.sum() == 0 or mask_curr.sum() == 0):
                return None

            actual_sum   = df.loc[mask_curr,   actual_col].sum()
            forecast_sum = df.loc[mask_curr,   forecast_col].sum()
            next_fcast   = df.loc[mask_next,   forecast_col].sum()
            actual_count = df.loc[mask_curr,   actual_col].notna().sum()

            # if the request supplied actual data → compare actual vs. forecast
            if actual_data_in_req is not None and actual_count > 0 and forecast_sum > 0:
                kpi = (actual_sum - forecast_sum) / forecast_sum * 100

            # otherwise, compare next‑period forecast growth
            elif actual_data_in_req is None and forecast_sum > 0 and next_fcast > 0:
                kpi = (next_fcast - forecast_sum) / forecast_sum * 100

            else:
                return None

            return round(kpi, 2)

        # 5) Loop, log, and build response
        response = {'end_date': end_date_str}
        for name, cfg in periods.items():
            start_dt      = cfg['start']
            end_dt_period = cfg['end']
            kpi_val       = compute_kpi(start_dt, end_dt_period, cfg['require_prev'])

            # log the raw sums + KPI
            row = {
                'aggregation':  name,
                'period_start': start_dt.strftime('%Y-%m-%d'),
                'period_end':   end_dt_period.strftime('%Y-%m-%d'),
                'actual_sum':   df.loc[
                                     df['Date'].between(start_dt, end_dt_period),
                                     actual_col
                                 ].sum(),
                'forecast_sum': df.loc[
                                     df['Date'].between(start_dt, end_dt_period),
                                     forecast_col
                                 ].sum(),
                'next_fcast':   df.loc[
                                     df['Date'].between(
                                         end_dt_period + pd.Timedelta(days=1),
                                         end_dt_period + pd.Timedelta(days=1) + (end_dt_period - start_dt)
                                     ),
                                     forecast_col
                                 ].sum(),
                'kpi_pct':      kpi_val
            }
            header = not os.path.exists(OUTPUT_FILE)
            pd.DataFrame([row]).to_csv(OUTPUT_FILE, mode='a', index=False, header=header)

            response[name] = {'kpi_pct': kpi_val}

        return jsonify(response)

    except Exception as e:
        return Response(
            json.dumps({'error': str(e)}),
            status=500,
            mimetype='application/json'
        )
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
