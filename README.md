# MediaTrustCascades

## Setup

### Localhost

No build step required. Serve the files over HTTP with any static file server — ES modules require HTTP, not `file://`.

```bash
# Python (built-in)
python3 -m http.server 8080

# Node (if available)
npx serve .
```

Then open `http://localhost:8080`.

### Deployment (Google Cloud Run)

The app is packaged as a static Nginx container.

**Build and push:**
```bash
PROJECT_ID=your-gcp-project-id
IMAGE=gcr.io/$PROJECT_ID/media-trust-cascades

docker build -t $IMAGE .
docker push $IMAGE
```

**Deploy:**
```bash
gcloud run deploy media-trust-cascades \
  --image $IMAGE \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi
```

The service scales to zero when idle. No environment variables or persistent state required.


## Description

Veritasiums video on complex systems features a simulation of forest fires: video: https://www.youtube.com/watch?v=HBluLfX2F_k simulation: https://www.veritasium.com/simulation5 The key idea is that the likelihood of earthquakes over a certain magnitude follows a power law distribution, and the simulation shows this graphically. I have a similar model, where instead of trees, there are news outlets. Outlets that are connected together (lets say, beside each other on a plane, as in the forest fire example) may propogate mistakes to each other. mistakes are factchecks, and the magnitude of the mistake (the impact it has on outlet trust (the color of the pixel for that outlet) also follows a power law distribution. Consider how I might show a similar graphical representation like the forest fire demo. It should be similarly interactive.

we are dealing with an X/Y grid. articles have location on the grid and spawn near their outlets attractor / centroid. each outlet has a different attractor. if outlet influence on articles is disabled, then the position is randomly determined. 

many things impact the article appearance: 
- owner: does article appear next to an owning centroid / attractor
- layoffs: reduce publication rates (# articles per month). layoffs have a low likelihood. layoffs also lead to increased likelihood of copying due to lower resource setting.
- acquisitions: outlets change ownership (can lead to greater consolidation). tends to increase # articles written due to increased efficiencies
- fact-check: fact checks happen randomly and expose errors in articles. these can cascade to other articles that copied it.

each of these is another part of the model and can be toggled on / off in the demo, and tweaked in terms of the effect sizes and likelihood of each event type.

articles will be colored by their impact on trust, which is assumed to be 0 if a fact-check has not determined the article is in error. articles are black dots that appear on a white plane at the determined coordinate. 
at each timestep, for each blank non-article pixel we randomly sample whether or not to generate an article there based on whether an article nearby should be copied, or a new one should be generated.

randomly sample the coordinates based on the factors that are enabled that impact it (i.e. ownership, outlets)
fact-checks turn the impacted article red, and red articles also turn other articles that copied them red in the subsequent time steps. 
an article stays red until it's lifespan finishes and then disappears. once an article turns red, it will no longer be copied.
pixels where a red article disappears from turn grey for a period, which represents a "cooling period". 
after the cooling period, that pixel goes back to white, and is again valid to be sampled from for a new article to appear. 
thus, the grey spaces represent the lasting impact of errors. 

the general loop of the simulation should be:
slow build up of articles
fact checks occur randomly, with impact sizes according to a power law distributions (as seen by infrequent red cascades across the network).

