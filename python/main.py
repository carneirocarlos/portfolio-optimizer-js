import cvxpy as cp
import numpy as np

# Data for initial stocks
stocks = [
    {
        "id": 1,
        "name": "AAPL",
        "price": 150.25,
        "volatility": 0.2,
        "return": 0.12,
        "alphaWeight": 0.35,
        "weight": 0.25,
    },
    {
        "id": 2,
        "name": "GOOGL",
        "price": 2750.80,
        "volatility": 0.245,
        "return": 0.15,
        "alphaWeight": 0.25,
        "weight": 0.25,
    },
    {
        "id": 3,
        "name": "MSFT",
        "price": 305.50,
        "volatility": 0.224,
        "return": 0.10,
        "alphaWeight": 0.20,
        "weight": 0.25,
    },
    {
        "id": 4,
        "name": "AMZN",
        "price": 3380.20,
        "volatility": 0.265,
        "return": 0.18,
        "alphaWeight": 0.20,
        "weight": 0.25,
    },
]

# Extract volatilities and alpha weights
volatilities = np.array([stock["volatility"] for stock in stocks])
alpha_weights = np.array([stock["alphaWeight"] for stock in stocks])

# Define variables
weights = cp.Variable(len(stocks))

# Calculate portfolio volatility using elementwise multiplication
portfolio_volatility = cp.norm(
    cp.multiply(volatilities, weights), 2
)  # Minimize portfolio volatility

# Define the regularization term
distance_to_alpha = cp.sum_squares(
    weights - alpha_weights
)  # Smoother regularization term to keep weights close to alphaWeights
scale = 0.05  # Regularization parameter

# Objective function to minimize
objective = cp.Minimize(portfolio_volatility + scale * distance_to_alpha)

# Define constraints
constraints = [
    cp.sum(weights) == 1,  # Weights must sum to 1
    weights >= 0.01,  # Ensure minimum weight to avoid weights too close to zero
    portfolio_volatility <= 0.20,  # Portfolio volatility must not exceed 20%
]

# Solve the optimization problem
problem = cp.Problem(objective, constraints)
result = problem.solve()

# Check if the problem was solved successfully
if problem.status in ["infeasible", "unbounded"]:
    print(f"Optimization failed: {problem.status}")
else:
    # Print the optimized weights
    print("Optimized Weights:")
    for i, stock in enumerate(stocks):
        print(f"{stock['name']}: {weights.value[i]:.4f}")
