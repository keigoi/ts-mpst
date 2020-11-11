
declareReceive(this); // adds this.receive()

// forward a message from the main to worker2
async function worker1() {
    // receive a port of MessageChannel
    const port = await receive();
    
    declareReceive(port);

    const name = await this.receive();
    port.postMessage(name + ", World!");
}

// forward the message from worker1 to the main
async function worker2() {
    const port = await receive();
    declareReceive(port);
    
    const name = await port.receive();
    this.postMessage(name + " Goodbye!");
}

(async function() {
    const workerId = await this.receive();

    if (workerId == 1) {
        await worker1();
    } else {
        await worker2();
        
    }
})();

