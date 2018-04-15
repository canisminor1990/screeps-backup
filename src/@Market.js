// Sell
Game.market.createOrder(ORDER_SELL, 'energy', 0.02, 20000, 'roomName')
// Buy
Game.market.createOrder(ORDER_BUY, 'energy', 0.02, 20000, 'roomName')
// Extend
Game.market.extendOrder('id',20000)
// Deal
Game.market.deal('5ad214d53d215610080ceac3', 200000, 'E8N45')
// Change
Game.market.changeOrderPrice('5ac02b85f00a5202a920bd99', 0.03)

Game.market.createOrder(ORDER_BUY, 'energy', 0.03, 500000, 'W2N41')
Game.market.createOrder(ORDER_BUY, 'energy', 0.03, 500000, 'E3N38')
Game.market.createOrder(ORDER_BUY, 'energy', 0.03, 500000, 'E9N47')
Game.market.createOrder(ORDER_BUY, 'energy', 0.03, 500000, 'E12N42')
Game.market.createOrder(ORDER_BUY, 'energy', 0.03, 500000, 'E13N42')
Game.market.createOrder(ORDER_BUY, 'energy', 0.03, 500000, 'E14N49')