# MealPrep360-WebsocketServer

## Hosting on DigitalOcean

This server is designed to be hosted on a [DigitalOcean Droplet](https://www.digitalocean.com/docs/droplets/how-to/create/).

### Recommended Droplet Specs

- 1 vCPU, 512MB RAM (sufficient for small/medium workloads)
- Ubuntu 22.04+ recommended

### SSH Key Setup

- Add your public SSH key when creating the Droplet for secure access.
- Connect using:
  ```bash
  ssh root@your-droplet-ip
  ```

### Firewall & Networking

- Ensure ports **80** (HTTP), **443** (HTTPS), and **22** (SSH) are open in the DigitalOcean networking panel.

### Backups (Optional)

- Enable backups or take snapshots for production deployments.

For more details, see the [DigitalOcean documentation](https://www.digitalocean.com/docs/).

## Making the Server Accessible via a Custom Domain

### 1. DNS Setup

- Go to your domain registrar's DNS settings.
- Add an A record:
  ```
  Host/Name: websocket
  Type:     A
  Value:    162.243.239.67
  TTL:      Default
  ```
- Wait for DNS to propagate (can take a few minutes to a few hours).

### 2. Nginx Reverse Proxy

- Install Nginx:
  ```bash
  sudo apt update
  sudo apt install nginx
  ```
- Create `/etc/nginx/sites-available/websocket`:

  ```nginx
  server {
      listen 80;
      server_name websocket.mealprep360.com;

      location / {
          proxy_pass http://localhost:3000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
      }
  }
  ```

- Enable and restart:
  ```bash
  sudo ln -s /etc/nginx/sites-available/websocket /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl restart nginx
  ```

### 3. SSL with Certbot

- Install and run Certbot:
  ```bash
  sudo apt install certbot python3-certbot-nginx
  sudo certbot --nginx -d websocket.mealprep360.com
  ```
- Follow the prompts to enable HTTPS.

### 4. Connect to Your WebSocket Server

- Use this URL:
  ```
  wss://websocket.mealprep360.com/
  ```
- Example client code:
  ```javascript
  const ws = new WebSocket('wss://websocket.mealprep360.com/');
  ws.onopen = () => ws.send('Hello!');
  ws.onmessage = (e) => console.log(e.data);
  ```
