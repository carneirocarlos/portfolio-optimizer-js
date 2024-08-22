'use client'

import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

// Mock data for stocks
const initialStocks = [
    { id: 1, name: 'AAPL', price: 150.25, volatility: 0.2, weight: 0.25, optimizedWeight: 0.25 },
    { id: 2, name: 'GOOGL', price: 2750.80, volatility: 0.25, weight: 0.25, optimizedWeight: 0.25 },
    { id: 3, name: 'MSFT', price: 305.50, volatility: 0.18, weight: 0.25, optimizedWeight: 0.25 },
    { id: 4, name: 'AMZN', price: 3380.20, volatility: 0.28, weight: 0.25, optimizedWeight: 0.25 },
]

export default function Component() {
    const [stocks, setStocks] = useState(initialStocks)
    const [targetVolatility, setTargetVolatility] = useState(0.2)
    const [optimizationStrength, setOptimizationStrength] = useState(5)

    // Placeholder function for portfolio optimization
    const optimizePortfolio = () => {
        // This is a mock optimization. In a real scenario, you'd use a proper algorithm.
        const newStocks = stocks.map(stock => ({
            ...stock,
            optimizedWeight: Math.max(0, stock.weight + (Math.random() - 0.5) * 0.1)
        }))

        // Normalize weights to ensure they sum to 1
        const totalWeight = newStocks.reduce((sum, stock) => sum + stock.optimizedWeight, 0)
        newStocks.forEach(stock => stock.optimizedWeight /= totalWeight)

        setStocks(newStocks)
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Portfolio Optimizer</h1>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Target Volatility</label>
                <Slider
                    value={[targetVolatility]}
                    onValueChange={(value) => setTargetVolatility(value[0])}
                    max={1}
                    step={0.01}
                    className="w-64"
                />
                <span>{targetVolatility.toFixed(2)}</span>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Optimization Strength</label>
                <Slider
                    value={[optimizationStrength]}
                    onValueChange={(value) => setOptimizationStrength(value[0])}
                    max={10}
                    step={1}
                    className="w-64"
                />
                <span>{optimizationStrength}</span>
            </div>

            <Button onClick={optimizePortfolio} className="mb-4">Optimize Portfolio</Button>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Stock</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Volatility</TableHead>
                        <TableHead>Current Weight</TableHead>
                        <TableHead>Optimized Weight</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stocks.map((stock) => (
                        <TableRow key={stock.id}>
                            <TableCell>{stock.name}</TableCell>
                            <TableCell>${stock.price.toFixed(2)}</TableCell>
                            <TableCell>{stock.volatility.toFixed(2)}</TableCell>
                            <TableCell>
                                <Input
                                    type="number"
                                    value={stock.weight}
                                    onChange={(e) => {
                                        const newStocks = stocks.map(s =>
                                            s.id === stock.id ? { ...s, weight: parseFloat(e.target.value) } : s
                                        )
                                        setStocks(newStocks)
                                    }}
                                    className="w-20"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                />
                            </TableCell>
                            <TableCell>{stock.optimizedWeight.toFixed(4)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}