"use client";
import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Typography, Box } from "@mui/material";
import MainCard from "components/MainCard";

// Generate dummy data
const generateLossData = () => {
  const data = [];
  const startDate = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    data.push({
      date: date.toISOString().split("T")[0], // Format as YYYY-MM-DD
      loss: parseFloat((Math.random() * 5000 + 1000).toFixed(2)), // Random loss between $1000-$6000
    });
  }

  return data;
};

export default function PotentialLossGraph() {
  const lossData = useMemo(() => generateLossData(), []);

  return (
    <MainCard title="Day-wise Potential Loss Graph">
      <Box mb={2}>
        <Typography variant="h6">Visualizing potential losses over time</Typography>
      </Box>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={lossData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(tick) => tick.substring(5)} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="loss" stroke="#d9534f" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </MainCard>
  );
}