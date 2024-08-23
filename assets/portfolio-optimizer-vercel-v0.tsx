import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

// Mock data for stocks, now including return
const initialStocks = [
    { id: 1, name: 'AAPL', price: 150.25, volatility: 0.2, return: 0.12, weight: 0.25 },
    { id: 2, name: 'GOOGL', price: 2750.80, volatility: 0.25, return: 0.15, weight: 0.25 },
    { id: 3, name: 'MSFT', price: 305.50, volatility: 0.18, return: 0.10, weight: 0.25 },
    { id: 4, name: 'AMZN', price: 3380.20, volatility: 0.28, return: 0.18, weight: 0.25 },
]

export default function Component() {
    const [stocks, setStocks] = useState(initialStocks)
    const [targetVolatility, setTargetVolatility] = useState(0.2)
    const [optimizationStrength, setOptimizationStrength] = useState(5)

    // Function to normalize weights to ensure they sum to 1
    const normalizeWeights = (stocks: typeof initialStocks) => {
        const totalWeight = stocks.reduce((sum, stock) => sum + stock.weight, 0)
        return stocks.map(stock => ({ ...stock, weight: stock.weight / totalWeight }))
    }

    // Placeholder function for portfolio optimization
    const optimizePortfolio = () => {
        // This is a simplified mock optimization. In a real scenario, you'd use a proper algorithm.
        let newStocks = stocks.map(stock => {
            // Adjust weight based on return and volatility (higher return and lower volatility preferred)
            const adjustmentFactor = (stock.return / stock.volatility) * (optimizationStrength / 5)
            return {
                ...stock,
                weight: Math.max(0, stock.weight * (1 + adjustmentFactor))
            }
        })

        // Normalize weights to ensure they sum to 1
        newStocks = normalizeWeights(newStocks)

        setStocks(newStocks)
    }

    // Calculate portfolio stats
    const portfolioReturn = stocks.reduce((sum, stock) => sum + stock.return * stock.weight, 0)
    const portfolioVolatility = Math.sqrt(
        stocks.reduce((sum, stock) => sum + Math.pow(stock.volatility * stock.weight, 2), 0)
    )

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Portfolio Optimizer</h1>
            <p className="mb-4">Maximize returns while constraining volatility</p>

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

            <div className="mb-4">
                <p>Portfolio Return: {(portfolioReturn * 100).toFixed(2)}%</p>
                <p>Portfolio Volatility: {(portfolioVolatility * 100).toFixed(2)}%</p>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Stock</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Volatility</TableHead>
                        <TableHead>Return</TableHead>
                        <TableHead>Weight</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stocks.map((stock) => (
                        <TableRow key={stock.id}>
                            <TableCell>{stock.name}</TableCell>
                            <TableCell>${stock.price.toFixed(2)}</TableCell>
                            <TableCell>{(stock.volatility * 100).toFixed(2)}%</TableCell>
                            <TableCell>{(stock.return * 100).toFixed(2)}%</TableCell>
                            <TableCell>{(stock.weight * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}