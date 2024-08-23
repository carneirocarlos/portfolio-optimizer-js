'use client'

import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

import {GLPK, LP, Result } from 'glpk.js'

// Mock data for stocks, now including return
const initialStocks = [
    { id: 1, name: 'AAPL', price: 150.25, volatility: 0.2, return: 0.12, weight: 0.25 },
    { id: 2, name: 'GOOGL', price: 2750.80, volatility: 0.25, return: 0.15, weight: 0.25 },
    { id: 3, name: 'MSFT', price: 305.50, volatility: 0.18, return: 0.10, weight: 0.25 },
    { id: 4, name: 'AMZN', price: 3380.20, volatility: 0.28, return: 0.18, weight: 0.25 },
]

export default function Component() {

    const [glpk, setGlpk] = useState<GLPK | null>(null);

    const [stocks, setStocks] = useState(initialStocks)
    const [targetVolatility, setTargetVolatility] = useState(0.2)
    const [optimizationStrength, setOptimizationStrength] = useState(5)

    useEffect(() => {
        const initGlpk = async () => {
            const glpkInstance: GLPK = await require('glpk.js').default();
            setGlpk(glpkInstance);
        };
        initGlpk();
    }, []);

    // // Function to normalize weights to ensure they sum to 1
    // const normalizeWeights = (stocks: typeof initialStocks) => {
    //     const totalWeight = stocks.reduce((sum, stock) => sum + stock.weight, 0)
    //     return stocks.map(stock => ({ ...stock, weight: stock.weight / totalWeight }))
    // }

    // // Placeholder function for portfolio optimization
    // const optimizePortfolio = () => {
    //     // This is a simplified mock optimization. In a real scenario, you'd use a proper algorithm.
    //     let newStocks = stocks.map(stock => {
    //         // Adjust weight based on return and volatility (higher return and lower volatility preferred)
    //         const adjustmentFactor = (stock.return / stock.volatility) * (optimizationStrength / 5)
    //         return {
    //             ...stock,
    //             weight: Math.max(0, stock.weight * (1 + adjustmentFactor))
    //         }
    //     })

    //     // Normalize weights to ensure they sum to 1
    //     newStocks = normalizeWeights(newStocks)

    //     setStocks(newStocks)
    // }

    // Calculate portfolio stats
    const portfolioReturn = stocks.reduce((sum, stock) => sum + stock.return * stock.weight, 0)
    const portfolioVolatility = Math.sqrt(
        stocks.reduce((sum, stock) => sum + Math.pow(stock.volatility * stock.weight, 2), 0)
    )

    const optimizePortfolio = async () => {

        // Extract data
        const returns = stocks.map(stock => stock.return);
        const volatilities = stocks.map(stock => stock.volatility);

        console.log('---------------------------');
        console.log(targetVolatility);
        console.log('---------------------------');

        // Set a maximum acceptable volatility
        // const maxVolatility = 0.25;

        // Define the LP problem
        const lp: LP = {
            name: "Portfolio Optimization",
            objective: {
                direction: glpk!.GLP_MAX,
                name: "maximize_return",
                vars: stocks.map((stock, i) => ({
                    name: `w_${stock.name}`,
                    coef: returns[i],
                }))
            },
            subjectTo: [
                // Constraint: Total weight = 1
                {
                    name: "weight_sum",
                    vars: stocks.map(stock => ({
                        name: `w_${stock.name}`,
                        coef: 1,
                    })),
                    bnds: { type: glpk!.GLP_FX, ub: 1, lb: 1 }
                },
                // Constraint: Portfolio volatility <= maxVolatility
                {
                    name: "max_volatility",
                    vars: stocks.map((stock, i) => ({
                        name: `w_${stock.name}`,
                        coef: volatilities[i],
                    })),
                    bnds: { type: glpk!.GLP_UP, ub: targetVolatility, lb: 0 }
                }
            ],
            bounds: stocks.map(stock => ({
                name: `w_${stock.name}`,
                type: glpk!.GLP_LO, // Lower bound
                lb: 0,
                ub: Infinity // No upper bound constraint for individual weights
            }))
        };

        // Solve the LP problem
        let result = await glpk!.solve(lp);

        if (result.result.status === glpk!.GLP_OPT) {
            console.log("Optimal solution found!");
            stocks.forEach(stock => {
                const weight = result.result.vars[`w_${stock.name}`];
                console.log(`${stock.name}: ${weight}`);
            });
        } else {
            console.log("No optimal solution found.");
        }

    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Portfolio Optimizer</h1>
            <p className="mb-4">Maximize returns while constraining volatility</p>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Risk Tolerance</label>
                <Slider
                    value={[targetVolatility]}
                    onValueChange={(value) => { setTargetVolatility(value[0]); optimizePortfolio(); }}
                    max={1}
                    step={0.01}
                    className="w-64"
                />
                <span>{targetVolatility.toFixed(2)}</span>
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