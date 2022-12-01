# A Dynamic Programming based Python3 program to
# find minimum of coins to make a given change V
import sys

# m is size of coins array (number of
# different coins)
def minCoins(coins, m, V):

    # table[i] will be storing the minimum
    # number of coins required for i value.
    # So table[V] will have result
    table = [0 for i in range(V + 1)]
    chips = [[] for i in range(V + 1)]

    # Base case (If given value V is 0)
    table[0] = 0

    # Initialize all table values as Infinite
    for i in range(1, V + 1):
        table[i] = sys.maxsize

    # Compute minimum coins required
    # for all values from 1 to V
    for i in range(1, V + 1):

        # Go through all coins smaller than i
        for coin_val in coins[::-1]:
            if coin_val <= i:
                sub_res = table[i - coin_val]
                if sub_res != sys.maxsize and sub_res + 1 < table[i]:
                    table[i] = sub_res + 1
                    chips[i] = chips[i] + chips[i - coin_val]
                    chips[i].append(coin_val)
                    break
        # print("V {}: chips {}".format(i, chips))

    if table[V] == sys.maxsize:
        return -1

    return (table[V], chips[V])


# Driver Code
if __name__ == "__main__":

    coins = [1, 5, 25, 100]
    m = len(coins)
    V = 97
    num, denoms = minCoins(coins, m, V)
    print("Minimum coins required is =", num)
    print("Denominations = ", denoms)

# This code is contributed by ita_c
