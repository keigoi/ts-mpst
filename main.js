const newWorkerViaBlob = (paths) => {
  const baseURL = window.location.href.replace(/\\/g, '/').replace(/\/[^\/]*$/, '/');
  const array = paths.map( s => 'importScripts("' + baseURL + s + '");' );
  const blob = new Blob(array, {type: 'text/javascript'});
  const url = window.URL.createObjectURL(blob);
  return new Worker(url);
};

const log = (msg) => {
    document.getElementById('log').innerHTML += msg + "<br/>"
    console.log(msg);
}

async function main() {
    log("starting main()");
    
    const worker1 = declareReceive( newWorkerViaBlob(['receive.js', 'worker.js']) );
    const worker2 = declareReceive( newWorkerViaBlob(['receive.js', 'worker.js']) );

    // send worker's ids
    worker1.postMessage(1);
    worker2.postMessage(2);

    // send ports
    const chan = new MessageChannel();
    worker1.postMessage(chan.port1, [chan.port1]);
    worker2.postMessage(chan.port2, [chan.port2]);

    // see if workers forward messages
    // * main --> worker1 --> worker2 --> main
    worker1.postMessage("Hello");
    
    const result = await worker2.receive();
    
    log("worker2 says:");
    log(result); // Hello, World! Goodbye!
    log("finishing main()");
};

document.getElementById('start-worker').onclick = () => {
    main();
}

