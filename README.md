# collab-demo
A small demo of how collaboration software can work. 
Uses mostly the same server code as is given [here](https://codesachin.wordpress.com/2015/06/27/redis-node-js-socket-io-event-driven-subscription-based-broadcasting/).

## Prerequisites
This needs node, npm and redis installed.
Before running the server make sure that the redis-server is running on port 6379.

## Start

```
git clone https://github.com/utkarsh-shekhar/collab-demo.git 
cd collab-demo
npm install
npm run build && npm start
```

The server should be up and running at http://localhost:8080/
