"use client";
import React, { useState, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Select, MenuItem, Typography, Box
} from "@mui/material";
import MainCard from "components/MainCard";


type OOSDataRegion = {
  region: string;
  sku: string;
  product: string;
  quantity: number;
};

type OOSDataCountry = {
  country: string;
  sku: string;
  product: string;
  quantity: number;
};

type OOSData = OOSDataRegion | OOSDataCountry;

// Dummy data generator
const generateOOSData = (type: "region" | "country"): OOSData[] => {
  if (type === "region") {
    return [
      { region: "North America", sku: "NA123", product: "Laptop", quantity: 0 },
      { region: "Europe", sku: "EU456", product: "Smartphone", quantity: 0 },
      { region: "Asia", sku: "AS789", product: "Headphones", quantity: 0 },
      { region: "North America", sku: "NA321", product: "Monitor", quantity: 0 },
      { region: "Europe", sku: "EU654", product: "Tablet", quantity: 0 },
    ];
  }
  return [
    { country: "USA", sku: "US123", product: "Laptop", quantity: 0 },
    { country: "Germany", sku: "DE456", product: "Smartphone", quantity: 0 },
    { country: "India", sku: "IN789", product: "Headphones", quantity: 0 },
    { country: "Canada", sku: "CA321", product: "Monitor", quantity: 0 },
    { country: "France", sku: "FR654", product: "Tablet", quantity: 0 },
  ];
};

export default function OOSStockTable() {
  const [view, setView] = useState<"region" | "country">("region");
  const oosData = useMemo(() => generateOOSData(view), [view]);

  return (
    <MainCard title="Out-of-Stock SKUs by Region or Country">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Monitor out-of-stock products</Typography>
        <Select value={view} onChange={(e) => setView(e.target.value as "region" | "country")}>
          <MenuItem value="region">By Region</MenuItem>
          <MenuItem value="country">By Country</MenuItem>
        </Select>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{view === "region" ? "Region" : "Country"}</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {oosData.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{(item as any)[view]}</TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell>{item.product}</TableCell>
                <TableCell>{item.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </MainCard>
  );
}
