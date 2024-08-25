'use client'

import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

import { GLPK, LP, Result } from 'glpk.js'

// Mock data for stocks, now including return
const initialStocks = [
    { id: 1, name: 'AAPL', price: 150.25, volatility: 0.2, return: 0.12, alphaWeight: 0.35, weight: 0.25 },
    { id: 2, name: 'GOOGL', price: 2750.80, volatility: 0.245, return: 0.15, alphaWeight: 0.25, weight: 0.25 },
    { id: 3, name: 'MSFT', price: 305.50, volatility: 0.224, return: 0.10, alphaWeight: 0.20, weight: 0.25 },
    { id: 4, name: 'AMZN', price: 3380.20, volatility: 0.265, return: 0.18, alphaWeight: 0.20, weight: 0.25 },
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

    useEffect(() => {
        if (glpk) {
            optimizePortfolio();
        }
    }, [targetVolatility]);




    const optimizePortfolio = async () => {
        const alphaWeights = stocks.map(stock => stock.alphaWeight);
        const volatilities = stocks.map(stock => stock.volatility);
        const scale = 100000; // Adjust this to match your regularization parameter
        const maxVolatility = targetVolatility;

        // Define the LP problem
        const lp = {
            name: 'Portfolio Optimization',
            objective: {
                direction: glpk!.GLP_MIN, // Minimize the objective
                name: 'objective_function',
                vars: [
                    ...stocks.map((stock, i) => ({
                        name: `w${i}`,
                        coef: stock.volatility
                    })),
                    ...stocks.map((stock, i) => ({
                        name: `dist_${i}`,
                        coef: scale
                    }))
                ]
            },
            subjectTo: [
                {
                    name: 'sum_weights',
                    vars: stocks.map((stock, i) => ({ name: `w${i}`, coef: 1 })),
                    bnds: { type: glpk!.GLP_FX, lb: 1, ub: 1 }
                },
                ...stocks.flatMap((stock, i) => [
                    {
                        name: `distance_constraint_${i}`,
                        vars: [
                            { name: `dist_${i}`, coef: 1 },
                            { name: `w${i}`, coef: -1 }
                        ],
                        bnds: { type: glpk!.GLP_LO, lb: -alphaWeights[i], ub: Infinity }
                    },
                    // {
                    //     name: `distance_constraint_${i}_neg`,
                    //     vars: [
                    //         { name: `dist_${i}`, coef: 1 },
                    //         { name: `w${i}`, coef: 1 }
                    //     ],
                    //     bnds: { type: glpk!.GLP_LO, lb: alphaWeights[i], ub: Infinity }
                    // }
                ]),
                {
                    name: 'volatility_constraint',
                    vars: stocks.map((stock, i) => ({ name: `w${i}`, coef: stock.volatility })),
                    bnds: { type: glpk!.GLP_UP, lb: 0, ub: maxVolatility }
                }
            ],
            bounds: [
                ...stocks.map((stock, i) => ({
                    name: `w${i}`,
                    type: glpk!.GLP_DB, // Double bounded (between lb and ub)
                    lb: 0,
                    ub: 1
                })),
                ...stocks.map((stock, i) => ({
                    name: `dist_${i}`,
                    type: glpk!.GLP_DB, // Free variable (can be negative)
                    lb: 0, // Ensure non-negativity
                    ub: Infinity
                }))
            ]
        };

        console.log('LP Problem Setup:', JSON.stringify(lp, null, 2));

        try {
            const result = await glpk!.solve(lp);

            if (result.result.status === glpk!.GLP_OPT) {
                console.log("Optimal solution found!");
                const updatedStocks = stocks.map((stock, i) => {
                    const weight = result.result.vars[`w${i}`];
                    // Ensure weight is non-negative
                    const adjustedWeight = Math.max(weight ?? 0, 0);
                    console.log(`${stock.name}: ${adjustedWeight}`);
                    return { ...stock, weight: adjustedWeight };
                });
                setStocks(updatedStocks);
            } else {
                console.log("No optimal solution found. Status:", result.result.status);
                console.log('Result:', result);
            }
        } catch (error) {
            console.error("An error occurred during optimization:", error);
        }
    };




    const calculatePortfolioVolatility = (weights: number[], covMatrix: number[][]): number => {
        const portfolioVariance = calculatePortfolioVariance(weights, covMatrix);
        return Math.sqrt(portfolioVariance); // Portfolio volatility
    };

    // Function to calculate portfolio variance
    const calculatePortfolioVariance = (weights: number[], covMatrix: number[][]): number => {
        let portfolioVariance = 0;

        // Loop over each pair of assets
        for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < weights.length; j++) {
                portfolioVariance += weights[i] * weights[j] * covMatrix[i][j];
            }
        }

        return portfolioVariance; // Portfolio variance
    };

    const calculateCovarianceMatrix = (returns: number[][]): number[][] => {
        const numStocks = returns.length;
        const numPeriods = returns[0].length;
        const covarianceMatrix = Array.from({ length: numStocks }, () => Array(numStocks).fill(0));

        // Compute mean returns for each stock
        const meanReturns = returns.map(stockReturns =>
            stockReturns.reduce((acc, r) => acc + r, 0) / numPeriods
        );

        // Compute covariance for each pair of stocks
        for (let i = 0; i < numStocks; i++) {
            for (let j = 0; j < numStocks; j++) {
                let cov = 0;

                for (let k = 0; k < numPeriods; k++) {
                    cov += (returns[i][k] - meanReturns[i]) * (returns[j][k] - meanReturns[j]);
                }

                covarianceMatrix[i][j] = cov / (numPeriods - 1); // Sample covariance
            }
        }

        return covarianceMatrix;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Portfolio Optimizer</h1>
            <p className="mb-4">Maximize returns while constraining volatility</p>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Risk Tolerance</label>
                <Slider
                    value={[targetVolatility]}
                    onValueChange={(value) => { setTargetVolatility(value[0]); }}
                    // max={1}
                    max={0.28}
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
                        <TableHead>Optimal AT Weight</TableHead>
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
                            <TableCell>{(stock.alphaWeight * 100).toFixed(2)}%</TableCell>
                            <TableCell>{(stock.weight * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}