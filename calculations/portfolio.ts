import { GLPK, LP, Result } from 'glpk.js'

export type Stock = {
    id: number;
    name: string;
    price: number;
    volatility: number;
    return: number;
    alphaWeight: number;  // Target weight of the stock in the index
    weight: number;  // Calculated weight of the stock in the optimized portfolio
};

export class PortfolioOptimizer {

    glpk: GLPK | null;

    constructor() {
        this.glpk = null;
    }

    /**
     * Asynchronously initializes the GLPK library.
     */
    async initialize() {
        this.glpk = await require('glpk.js').default();
    }

    /**
     * Optimizes the portfolio to minimize the distance between the portfolio weights
     * and the target index weights while constraining the overall portfolio volatility.
     * 
     * @param stocks - An array of Stock objects representing the available stocks.
     * @param maxVolatility - The maximum allowable portfolio volatility.
     * @returns An array of Stock objects with updated weights if optimization is successful, otherwise null.
     */
    async optimize(stocks: Stock[], maxVolatility: number): Promise<Stock[] | null> {
        const alphaWeights = stocks.map(stock => stock.alphaWeight);  // Target index weights for each stock
        const scale = 1;  // Scaling factor for the objective function, adjust as needed

        // Define the linear programming (LP) problem for portfolio optimization
        const lp = {
            name: 'Portfolio Optimization',
            objective: {
                direction: this.glpk!.GLP_MIN,  // Objective is to minimize the function
                name: 'objective_function',
                vars: [
                    ...stocks.map((stock, i) => ({
                        name: `dist_${i}`,  // Variable representing the deviation from target weight
                        coef: scale  // Coefficient for the deviation in the objective function
                    }))
                ]
            },
            subjectTo: [
                {
                    name: 'sum_weights',
                    vars: stocks.map((stock, i) => ({ name: `w${i}`, coef: 1 })),
                    bnds: { type: this.glpk!.GLP_FX, lb: 1, ub: 1 }  // Constraint: Sum of weights must be 1
                },
                ...stocks.flatMap((stock, i) => [
                    {
                        name: `distance_constraint_${i}`,
                        vars: [
                            { name: `dist_${i}`, coef: 1 },  // Distance variable
                            { name: `w${i}`, coef: -1 }  // Weight variable for the stock
                        ],
                        bnds: { type: this.glpk!.GLP_LO, lb: -alphaWeights[i], ub: Infinity }  // Constraint: Lower bound on the deviation
                    },
                ]),
                {
                    name: 'volatility_constraint',
                    vars: stocks.map((stock, i) => ({ name: `w${i}`, coef: stock.volatility ** 2 })),  // Quadratic term for volatility
                    bnds: { type: this.glpk!.GLP_UP, lb: 0, ub: maxVolatility ** 2 }  // Constraint: Portfolio volatility must not exceed maxVolatility
                }
            ],
            bounds: [
                ...stocks.map((stock, i) => ({
                    name: `w${i}`,
                    type: this.glpk!.GLP_DB,  // Double bounded variable (between lb and ub)
                    lb: 0,  // Lower bound for weights
                    ub: 1   // Upper bound for weights
                })),
                ...stocks.map((stock, i) => ({
                    name: `dist_${i}`,
                    type: this.glpk!.GLP_DB,  // Free variable (can be non-negative)
                    lb: 0,  // Ensure non-negativity for deviation
                    ub: Infinity  // No upper bound for deviation
                }))
            ]
        };

        console.log('LP Problem Setup:', JSON.stringify(lp, null, 2));

        try {
            const result = await this.glpk!.solve(lp);  // Solve the LP problem using GLPK

            if (result.result.status === this.glpk!.GLP_OPT) {  // Check if an optimal solution was found
                console.log("Optimal solution found!");
                const updatedStocks = stocks.map((stock, i) => {
                    const weight = result.result.vars[`w${i}`];  // Retrieve the optimized weight for each stock
                    console.log(`${stock.name}: ${weight}`);
                    return { ...stock, weight: weight };  // Update stock with the optimized weight
                });
                return updatedStocks;
            } else {
                console.log("No optimal solution found. Status:", result.result.status);
                console.log('Result:', result);
            }
        } catch (error) {
            console.error("An error occurred during optimization:", error);
        }

        return null;  // Return null if no optimal solution is found
    };
}
