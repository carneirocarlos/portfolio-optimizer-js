import { GLPK, LP, Result } from 'glpk.js'

export type Stock = {
    id: number;
    name: string;
    price: number;
    volatility: number;
    return: number;
    alphaWeight: number;
    weight: number;
};

export class PortfolioOptimizer {

    glpk: GLPK | null;

    constructor() {
        this.glpk = null;
    }

    async initialize() {
        this.glpk = await require('glpk.js').default();
    }

    async optimize(stocks: Stock[], maxVolatility: number): Promise<Stock[] | null> {
        const alphaWeights = stocks.map(stock => stock.alphaWeight);
        const scale = 1; // Adjust this to match your regularization parameter

        // Define the LP problem
        const lp = {
            name: 'Portfolio Optimization',
            objective: {
                direction: this.glpk!.GLP_MIN, // Minimize the objective
                name: 'objective_function',
                vars: [
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
                    bnds: { type: this.glpk!.GLP_FX, lb: 1, ub: 1 }
                },
                ...stocks.flatMap((stock, i) => [
                    {
                        name: `distance_constraint_${i}`,
                        vars: [
                            { name: `dist_${i}`, coef: 1 },
                            { name: `w${i}`, coef: -1 }
                        ],
                        bnds: { type: this.glpk!.GLP_LO, lb: -alphaWeights[i], ub: Infinity }
                    },
                ]),
                {
                    name: 'volatility_constraint',
                    vars: stocks.map((stock, i) => ({ name: `w${i}`, coef: stock.volatility ** 2 })),
                    bnds: { type: this.glpk!.GLP_UP, lb: 0, ub: maxVolatility ** 2 }
                }
            ],
            bounds: [
                ...stocks.map((stock, i) => ({
                    name: `w${i}`,
                    type: this.glpk!.GLP_DB, // Double bounded (between lb and ub)
                    lb: 0,
                    ub: 1
                })),
                ...stocks.map((stock, i) => ({
                    name: `dist_${i}`,
                    type: this.glpk!.GLP_DB, // Free variable (can be negative)
                    lb: 0, // Ensure non-negativity
                    ub: Infinity
                }))
            ]
        };

        console.log('LP Problem Setup:', JSON.stringify(lp, null, 2));

        try {
            const result = await this.glpk!.solve(lp);

            if (result.result.status === this.glpk!.GLP_OPT) {
                console.log("Optimal solution found!");
                const updatedStocks = stocks.map((stock, i) => {
                    const weight = result.result.vars[`w${i}`];
                    console.log(`${stock.name}: ${weight}`);
                    return { ...stock, weight: weight };
                });
                return updatedStocks;
            } else {
                console.log("No optimal solution found. Status:", result.result.status);
                console.log('Result:', result);
            }
        } catch (error) {
            console.error("An error occurred during optimization:", error);
        }

        return null;
    };


}