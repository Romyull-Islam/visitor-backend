# visitor-backend

A small Express + MongoDB API that logs visitors to a portfolio website and geolocates them with [ipinfo](https://ipinfo.io). It is meant to be called from a static site (for example on GitHub Pages); it records each new visitor's approximate location and returns the visitor count and the list of locations (for example, to draw a visitor map).

## How it works

1. The client sends `POST /api/visit`.
2. The server takes the client IP from the first entry of `X-Forwarded-For` (or the socket address when the header is missing).
3. It looks up the IP with the ipinfo API to get the city, country and coordinates.
4. If the IP is not in the database yet, it stores a new record (unique visitors only).
5. It responds with the total number of stored visitors and their locations.

## Privacy note

The service **stores visitor IP addresses** in MongoDB, together with city, country, latitude/longitude and a timestamp. The IP is not included in the API response, but it is kept in the database. If you deploy this, tell your visitors (e.g. in a privacy notice) and consider retention limits for the stored data.

## API

### `POST /api/visit`

No request body is needed.

Response `200`:

```
{
  "totalVisits": <number of unique visitors>,
  "visits": [
    { "city": "<city>", "country": "<country code>", "lat": <latitude>, "lon": <longitude> }
  ]
}
```

`visits` holds one entry per unique IP, with only `city`, `country`, `lat` and `lon`.

Response `500`: `{ "error": "Failed to log visit" }`

CORS is open to all origins (`origin: '*'`).

## Data model

Collection `visits` (Mongoose model `Visit`):

| Field | Type |
|---|---|
| `ip` | String |
| `city` | String |
| `country` | String |
| `lat` | Number |
| `lon` | Number |
| `timestamp` | Date (defaults to the time of the visit) |

## Configuration

Set these environment variables (a `.env` file is loaded with `dotenv` and is git-ignored):

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | yes | MongoDB connection string (e.g. MongoDB Atlas) |
| `IPINFO_TOKEN` | yes | ipinfo.io API token |
| `PORT` | no | Port to listen on (default `3000`) |

Example `.env`:

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>
IPINFO_TOKEN=<your ipinfo token>
PORT=3000
```

## Running locally

Requires Node.js and a MongoDB database.

```bash
npm install
npm start          # runs node server.js
```

Then test it:

```bash
curl -X POST http://localhost:3000/api/visit
```

When running locally the client IP is a loopback address, so ipinfo may return no location; in that case the coordinates are stored as `0, 0`.

## Stack

Express, Mongoose, axios, cors, dotenv.
