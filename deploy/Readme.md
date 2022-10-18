# Deploy on Kubernetes

GChat notifications with a secret like:
```
kubectl create secret generic consoledot-e2e-gchat --from-literal=webhook="..."
```

Username and password:
```
kubectl create secret generic consoledot-e2e-user --from-literal=rh_username="..." --from-literal=rh_password="..."
```

And finally the job:

```
kubectl apply -f deploy/job.yaml
```
