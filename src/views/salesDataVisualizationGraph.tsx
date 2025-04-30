"use client";
import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { MenuItem, Select, Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import MainCard from "components/MainCard";

// Dummy data
const generateSalesData = (type: "category" | "company") => {
  if (type === "category") {
    return [
      { name: "Electronics", sales: 12000 },
      { name: "Clothing", sales: 8500 },
      { name: "Furniture", sales: 6500 },
      { name: "Grocery", sales: 15000 },
      { name: "Automobile", sales: 9000 },
    ];
  }
  return [
    { name: "Company A", sales: 18000 },
    { name: "Company B", sales: 14000 },
    { name: "Company C", sales: 12000 },
    { name: "Company D", sales: 10000 },
  ];
};

// Colors for Pie Chart
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#d9534f"];

export default function SalesDataVisualization() {
  const [view, setView] = useState<"category" | "company">("category");
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  const salesData = useMemo(() => generateSalesData(view), [view]);

  return (
    <MainCard title="Sales Data Visualization">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Select value={view} onChange={(e) => setView(e.target.value as "category" | "company")}>
          <MenuItem value="category">By Category</MenuItem>
          <MenuItem value="company">By Company</MenuItem>
        </Select>

        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={(_, value) => value && setChartType(value)}
        >
          <ToggleButton value="bar">Bar Chart</ToggleButton>
          <ToggleButton value="pie">Pie Chart</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {chartType === "bar" ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie data={salesData} dataKey="sales" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
              {salesData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </MainCard>
  );
}