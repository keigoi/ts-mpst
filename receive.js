const declareReceive = (obj) => {
    obj.resolves = [];
    obj.queue = [];
    
    obj.onmessage = function (e) {
        if(this.resolves.length>0){
            const resolve = this.resolves.shift();
            resolve(e.data);
        } else {
            this.queue.push(e.data);
        }
    };
    
    obj.receive = function() {
        if (this.queue.length>0) {
            return Promise.resolve(this.queue.shift())
        } else {
            return new Promise((resolve,_) => obj.resolves.push(resolve));
        }
    }

    return obj;
}
