// if something goes wrong use Util.resetBoostProduction() to reset all rooms or Util.resetBoostProduction('roomName'), and MAKE_COMPOUNDS: false to turn off the process;
Util.resetBoostProduction()
Util.resetBoostProduction('roomName')

// E8N45
Game.rooms['E8N45'].placeReactionOrder('5ab60ab4c107f9746ab273c4', 'OH', '20000');
Game.rooms['E8N45'].placeReactionOrder('5ab60ab4c107f9746ab273c4', 'GH2O', '9000');
Game.getObjectById('5ab9978916654157c2cd0a5d').send('O', 100000, 'E14N49')

// E9N47
Game.rooms['E9N47'].placeReactionOrder('5ab7018a26ac6137d696e4b5', 'UL', '20000');

// E12N42
Game.rooms['E12N42'].placeReactionOrder('5ab75f4cbb8cac1dafc367d5', 'ZK', '20000');

// E3N38
Game.rooms['E3N38'].placeReactionOrder('5ab9ad7712f38b0f500aeaf5', 'G', '20000');

// E13N42
Game.rooms['E13N42'].placeReactionOrder('5ab75f4cbb8cac1dafc367d5', 'ZK', '9000');

// W2N41
Game.rooms['W2N41'].placeReactionOrder('5ab75f4cbb8cac1dafc367d5', 'GH', '9000');

// ====================================================================================

// set.lab
_.values(Game.structures).filter(i => i.structureType === 'lab').map(i => i.room.setStore(i.id, RESOURCE_ENERGY, 2000));
// room.registerReactorFlower(...)
Game.rooms['roomName'].registerReactorFlower('a', 'b');
// room.setStore(...)
Game.rooms['E8N45'].setStore('5acd81cf6bec176d808b6418', RESOURCE_ENERGY, 5000);
Game.rooms['E8N45'].setStore('5acd81cf6bec176d808b6418', 'power', 100);
Game.rooms['E8N45'].setStore('5acda9bb4b207930933aa1c7', RESOURCE_ENERGY, 300000);
Game.rooms['E8N45'].setStore('5acda9bb4b207930933aa1c7', RESOURCE_GHODIUM, 5000);
delete Memory.rooms['E8N45'].resources.nuker

