# Pictionary
Load balanced angular 4 web application with redis communication layer.

### Prerequisites
* NodeJS v4
* Redis

### Installation

##### Web server
1. Install [NodeJS](https://nodejs.org/en/) and [Redis](https://redis.io/).
2. Clone the project with `git clone https://github.com/lorjala/pictionary.git`.
3. Move to app directory `cd PictionaryApp`.
4. Install node modules with `npm install`.
5. Configure environment variables.
6. Run the application with `node index.js`.

###### Environment variables
* PORT: server port
* REDIS_HOST: redis host
* REDIS_PORT: redis port

##### Client
1. Move to client directory `cd client`.
2. Install node modules with `npm install`.
3. Install angular-cli globally with `npm install -g @angular/cli` for easy build.
4. Build the angular application with `ng build`.

##### Load balancer
1. Move to load balancer directory `cd ../../LoadBalancer`.
2. Configure web servers addresses and ports in the index.js.
3. Configure environment variables.
3. Launch the load balancer with `node index.js`.

###### Environment variables
* PORT: load balancer PORT