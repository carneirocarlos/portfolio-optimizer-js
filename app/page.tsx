'use client'

import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Slider } from "@/components/ui/slider"

import { PortfolioOptimizer, Stock } from '@/calculations/portfolio'

// Mock data for stocks, now including return
const initialStocks: Stock[] = [
    { id: 1, name: 'AAPL', price: 150.25, volatility: 0.2, return: 0.12, alphaWeight: 0.35, weight: 0.25 },
    { id: 2, name: 'GOOGL', price: 2750.80, volatility: 0.245, return: 0.15, alphaWeight: 0.25, weight: 0.25 },
    { id: 3, name: 'MSFT', price: 305.50, volatility: 0.224, return: 0.10, alphaWeight: 0.20, weight: 0.25 },
    { id: 4, name: 'AMZN', price: 3380.20, volatility: 0.265, return: 0.18, alphaWeight: 0.20, weight: 0.25 },
]

export default function Component() {

    const [portfolioOptimizer, setPortfolioOptimizer] = useState<PortfolioOptimizer | null>(null);

    const [stocks, setStocks] = useState(initialStocks)
    const [maxVolatility, setMaxVolatility] = useState(0.22)
    const [optimizationStrength, setOptimizationStrength] = useState(5)
    const [isSmartphone, setIsSmartphone] = useState(false)

    useEffect(() => {
        const initPortfolioOptimizer = async () => {
            const portfolioOptimizerInstance = new PortfolioOptimizer();
            await portfolioOptimizerInstance.initialize();
            setPortfolioOptimizer(portfolioOptimizerInstance);
        };

        initPortfolioOptimizer();

        const checkIfSmartphone = () => {
            setIsSmartphone(window.innerWidth < 640);
        };

        checkIfSmartphone();
        window.addEventListener('resize', checkIfSmartphone);

        return () => window.removeEventListener('resize', checkIfSmartphone);
    }, []);

    useEffect(() => {
        if (portfolioOptimizer) {
            optimizePortfolio();
        }
    }, [portfolioOptimizer, maxVolatility]);

    const optimizePortfolio = async () => {
        const updatedStocks = await portfolioOptimizer!.optimize(initialStocks, maxVolatility);
        if (updatedStocks != null) {
            setStocks(updatedStocks);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">POC - Portfolio Optimizer</h1>
            <p className="mb-4">Closely track Alpha Theory weights while constraining portfolio volatility.</p>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Risk Tolerance</label>
                <Slider
                    value={[maxVolatility]}
                    onValueChange={(value) => { setMaxVolatility(value[0]); }}
                    // max={1}
                    max={0.30}
                    step={0.01}
                    className="w-64"
                />
                <span>{maxVolatility.toFixed(2)}</span>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Stock</TableHead>
                        {!isSmartphone && <TableHead>Price</TableHead>}
                        <TableHead>Volatility</TableHead>
                        {!isSmartphone && <TableHead>Return</TableHead>}
                        <TableHead>Alpha Theory Weight</TableHead>
                        <TableHead>Weight</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stocks.map((stock) => (
                        <TableRow key={stock.id}>
                            <TableCell>{stock.name}</TableCell>
                            {!isSmartphone && <TableCell>${stock.price.toFixed(2)}</TableCell>}
                            <TableCell>{(stock.volatility * 100).toFixed(2)}%</TableCell>
                            {!isSmartphone && <TableCell>{(stock.return * 100).toFixed(2)}%</TableCell>}
                            <TableCell>{(stock.alphaWeight * 100).toFixed(2)}%</TableCell>
                            <TableCell>{(stock.weight * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}