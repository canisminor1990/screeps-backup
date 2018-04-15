"use strict";

let Util = require('./util');

let mod = {
    analyze() {
        this.boostAllocation();
    },
    boostAllocation() {

        if (!global.ALLOCATE_COMPOUNDS)
            return;

        let roomTrading = Memory.boostTiming.roomTrading;
        if (roomTrading.boostProduction)
            return;

        let myRooms = _.filter(Game.rooms, {'my': true}),
            labArray = [],
            roomFound,
            orderingRoom = global.orderingRoom(),
            numberOfOrderingRooms = orderingRoom.length,
            timing = (!roomTrading.boostAllocation && Memory.boostTiming.timeStamp + 10 === Game.time && global.MAKE_COMPOUNDS) || Game.time % global.ALLOCATE_COMPOUNDS_INTERVAL === 0;

        if (numberOfOrderingRooms === 0 && timing) {

            console.log('start the allocating');

            for (let room of myRooms) {

                let data = room.memory.resources;

                if (_.isUndefined(data) || _.isUndefined(data.lab) || _.isUndefined(data.reactions)) {
                    console.log(`There is no room.memory.resources: skipping ${room.name}`);
                    continue;
                }

                console.log(`${room.name}`);

                Object.keys(global.COMPOUNDS_TO_ALLOCATE).forEach(compound => {

                    let compoundObject = global.COMPOUNDS_TO_ALLOCATE[compound],
                        roomEnabled = compoundObject.allocateRooms.indexOf(room.name) > -1 || compoundObject.allocateRooms.length === 0,
                        storageLab = function (room, compound) {

                            // lab order placed?
                            let returnValue = _.filter(data.lab, labs => {
                                return (labs.reactionState === 'Storage' && _.some(labs.orders, order => {
                                    // TODO (labs.orders.length === 1 && order.type === 'energy') ???
                                    return order.type === compound || (labs.orders.length === 1 && order.type === 'energy');
                                }));
                            });

                            if (returnValue.length === 0)
                                return false;
                            else if (returnValue.length === 1)
                                return returnValue[0];
                            else
                                console.log(`WARNING  ${room.name} has ${returnValue.length} registered lab to STORE ${compound}`);

                        },
                        superiorAllocated = false;

                    if (compoundObject.allocate && roomEnabled) {

                        let storageLabExist = storageLab(room, compound),
                            allRoomResources = function (compound) {
                                let returnValue = 0;
                                for (let room of myRooms) {
                                    if (!_.isUndefined(global.COMPOUNDS_TO_ALLOCATE[compound])) {

                                        let resourcesAll = room.resourcesAll[compound] || 0,
                                            reservedAmount = global.COMPOUNDS_TO_ALLOCATE[compound].amount + global.COMPOUNDS_TO_ALLOCATE[compound].threshold,
                                            amountToTrade = resourcesAll - reservedAmount;

                                        if (amountToTrade >= global.MIN_OFFER_AMOUNT)
                                            returnValue += amountToTrade;
                                    }
                                }
                                return returnValue;

                            },
                            empireResources = allRoomResources(compound),
                            roomOrderNeeded = (room.resourcesAll[compound] || 0) + (room.resourcesOrders[compound] || 0) < compoundObject.threshold,
                            roomOrderGranted = empireResources >= compoundObject.amount;

                        if (compoundObject.superior) {
                            let superiorLabExist = storageLab(room, compoundObject.superior);
                            if (superiorLabExist || (room.resourcesAll[compoundObject.superior] || 0) >= LAB_BOOST_MINERAL * 15)
                                superiorAllocated = true;
                        }

                        switch (compoundObject.storeTo) {

                            case 'lab':

                                let seedA = data.reactions.seed_a,
                                    seedB = data.reactions.seed_b,
                                    orderAmount = compoundObject.amount,
                                    storageLabId,
                                    storageLab;

                                if (!storageLabExist && !superiorAllocated) {

                                    let labArrayData = _.filter(data.lab, lab => {

                                        let changeLab = _.some(lab.orders, order => {
                                            if (global.COMPOUNDS_TO_ALLOCATE[order.type])
                                                return !global.COMPOUNDS_TO_ALLOCATE[order.type].allocate;
                                        });
                                        if (lab.id !== seedA && lab.id !== seedB && lab.reactionState !== 'Storage' || (changeLab && lab.id !== seedA && lab.id !== seedB && lab.reactionState === 'Storage'))
                                            return lab;
                                    });

                                    if (labArrayData.length > 0) {
                                        for (let item of labArrayData) {
                                            labArray.push(Game.getObjectById(item.id));
                                        }
                                    } else
                                        console.log(`${room.name} ha no candidates`);

                                    if (labArray.length > 1) {
                                        storageLab = room.controller.pos.findClosestByPath(labArray);
                                        if (storageLab === null)
                                            storageLab = room.controller.pos.findClosestByRange(labArray);

                                        global.logSystem(room.name, `found lab in ${room.name} for ${compound} labId: ${storageLab.id}`);

                                    } else {
                                        storageLab = labArray[0];
                                        if (data.reactions.orders.length > 0 && !global.MAKE_REACTIONS_WITH_3LABS)
                                            console.log(`There are only 3 labs in ${room.name} reaction for ${data.reactions.orders[0].type} is deleted`);
                                        room.memory.resources.reactions.orders = [];
                                    }

                                } else if (!superiorAllocated) {
                                    global.logSystem(room.name, `Lab ${storageLabExist.id} is already registered in ${room.name} for ${compound}`);
                                    storageLab = Game.getObjectById(storageLabExist.id);
                                }

                                if (storageLab !== null && storageLab !== undefined) {

                                    global.logSystem(room.name, `${room.name} ${storageLab.id} ${storageLab.mineralAmount} ${storageLab.mineralType}`);

                                    storageLabId = storageLab.id;

                                    let labObject = data.lab.find(labs => labs.id === storageLabId),
                                        labIndex = data.lab.indexOf(labObject),
                                        currentOrder = labObject.orders.find(order => order.type === compound),
                                        labOrders = labObject.orders.find(order => order.type !== compound),
                                        energyOrders = labObject.orders.find(order => order.type === 'energy'),
                                        labOrderNeeded = (currentOrder && currentOrder.orderRemaining <= compoundObject.labRefilledAt && storageLab.mineralAmount <= compoundObject.labRefilledAt) || _.isUndefined(currentOrder),
                                        roomResources = room.resourcesAll[compound] || 0,
                                        labOrderGranted = roomResources >= LAB_BOOST_MINERAL * 15,
                                        labStoreAmount = Math.min(LAB_MINERAL_CAPACITY, orderAmount);

                                    if (!storageLabExist && labOrderGranted && !superiorAllocated) {
                                        global.logSystem(room.name, `registering boostLab in ${room.name}, id: ${storageLabId} for ${compound}`);
                                        room.registerBoostLab(storageLabId);
                                    } else if (!storageLabExist && !labOrderGranted) {
                                        global.logSystem(room.name, `registering boostLab in ${room.name}, is delayed. There are only ${roomResources} ${compound}`);
                                    } else if (!storageLabExist && superiorAllocated) {
                                        console.log(`registering canceled, ${compoundObject.superior} allocated in ${room.name}`);
                                    } else if ((!_.isUndefined(currentOrder) && currentOrder.orderRemaining === 0 && storageLab.mineralAmount <= compoundObject.labRefilledAt && !roomOrderGranted && !labOrderGranted) || superiorAllocated) {
                                        // TODO if superior just exist and not allocated, allocate it in this turn
                                        if (!roomOrderGranted && !labOrderGranted)
                                            global.logSystem(room.name, `orderGranted: ${labOrderGranted} unRegistering boostLab in ${room.name}, id: ${storageLabId} for ${compound}`);
                                        else if (superiorAllocated)
                                            global.logSystem(room.name, `superior ${compoundObject.superior} allocated. unRegistering boostLab in ${room.name}, id: ${storageLabId} for ${compound}`);
                                        room.unRegisterBoostLab(storageLabId);
                                    }

                                    if (roomOrderNeeded && roomOrderGranted && !roomFound && !superiorAllocated) {
                                        global.logSystem(room.name, `${room.name} placeRoomOrder to room ${room.name}, ${orderAmount} ${compound}`);
                                        room.placeRoomOrder(storageLabId, compound, orderAmount);
                                        roomFound = room;
                                    } else if (!roomOrderGranted && roomOrderNeeded && !superiorAllocated)
                                        global.logSystem(room.name, `there are not enough resources to roomOrder a lab in ${room.name} empireResources: ${empireResources} ${compound}`);

                                    if (labOrderNeeded && labOrderGranted && !superiorAllocated) {

                                        room.memory.resources.lab[labIndex].orders = [];
                                        room.memory.resources.lab[labIndex].orders.push(energyOrders);

                                        global.logSystem(room.name, `storageLab.mineralAmount: ${storageLab.mineralAmount} compoundObject.labRefilledAt: ${compoundObject.labRefilledAt}`);


                                        if (labStoreAmount > roomResources || labStoreAmount - storageLab.mineralAmount > roomResources)
                                            labStoreAmount = roomResources;
                                        else if (!_.isUndefined(currentOrder))
                                            labStoreAmount = labStoreAmount - storageLab.mineralAmount;

                                        global.logSystem(room.name, `${room.name} placeOrder to registered LAB ${storageLab.id}, ${labStoreAmount} ${compound}`);

                                        room.placeOrder(storageLabId, compound, labStoreAmount);

                                    } else if (storageLab.mineralType !== compound && storageLab.mineralType !== null && labOrderGranted && !superiorAllocated) {

                                        // delete the old older
                                        room.memory.resources.lab[labIndex].orders = [];
                                        room.memory.resources.lab[labIndex].orders.push(labOrders);

                                        if (labStoreAmount > roomResources)
                                            labStoreAmount = roomResources;

                                        global.logSystem(room.name, `labOrders in ${room.name} is deleted`);
                                        global.logSystem(room.name, `${room.name} placeOrder to LAB ${storageLab.id}, ${labStoreAmount} ${compound}`);
                                        room.placeOrder(storageLabId, compound, labStoreAmount);

                                    } else if (!currentOrder && labOrderGranted && !superiorAllocated) {

                                        if (labStoreAmount > roomResources)
                                            labStoreAmount = roomResources;

                                        console.log(`${room.name} placeOrder to LAB (there is no order) ${storageLab.id}, ${labStoreAmount} ${compound}`);
                                        if (data.lab.length === 3 && data.reactions.orders.length > 0) {
                                            //delete reactions
                                            global.logSystem(room.name, `reactions deleted in ${room.name} there are only 3 labs`);
                                            room.memory.resources.reactions.orders = [];
                                        }
                                        room.placeOrder(storageLabId, compound, labStoreAmount);
                                    }
                                } else
                                    global.logSystem(room.name, `${room.name} NO storage lab candidates found for ${compound}`);

                                break;

                            case 'storage':
                                if (compound === 'power') {
                                    if (_.isUndefined(room.structures.powerSpawn)) {
                                        global.logSystem(room.name, `There is no powerSpawn in ${room.name} ${compound} in not distributed`);
                                        break;
                                    }
                                }
                                if (roomOrderNeeded && roomOrderGranted && !roomFound) {
                                    global.logSystem(room.name, `${room.name} placeOrder to STORAGE ${room.storage.id}, ${compoundObject.amount} ${compound}`);
                                    room.placeRoomOrder(room.storage.id, compound, compoundObject.amount);
                                    room.placeOrder(room.storage.id, compound, compoundObject.amount);
                                    roomFound = room;
                                }
                                break;
                        }
                    }
                });
            }
            if (roomFound) {
                Memory.boostTiming.roomTrading.boostAllocation = true;
                Memory.boostTiming.timeStamp = Game.time;
                roomFound.GCOrders();
            }
        }
    }
};


module.exports = mod;

