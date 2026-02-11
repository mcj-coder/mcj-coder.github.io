---
title: "RPi Cluster (Part 4) - Installing Kubernetes"
description: "Installing Kubernetes on the Raspberry Pi cluster with kubeadm and Weave Net networking"
pubDate: 2020-02-20
tags: ["kubernetes", "raspberry-pi", "devops", "kubeadm"]
source: "hugo"
originalUrl: "https://codifice.blog/rpi-cluster-part-4-installing-kubernetes"
---

Now the RPi Cluster is assembled, set up and has its network correctly configured we can install Kubernetes!

# On the Master RPi

```bash
sudo kubeadm config images pull -v3
sudo kubeadm init --token-ttl=0
```

At the end of the output, there's the command that must be used to join worker nodes to the master, it will resemble:

```bash
kubeadm join 10.0.1.2:6443 --token hqrwwd.zia49kiu5096aq0p \
    --discovery-token-ca-cert-hash sha256:2b22b8c62774bdfd051720326ccb49970457140a19ec9f425c28727ef4b4dae9
```

Initialize kubeadm:

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

Install the pod network (Weave Net):

```bash
kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"
sudo sysctl net.bridge.bridge-nf-call-iptables=1
```

Check the pods in `kube-system` and confirm all is running:

```bash
kubectl get pods --namespace kube-system
```

## Join Worker Nodes

SSH onto each node and execute the join command provided previously:

```bash
sudo kubeadm join 10.0.1.2:6443 --token hqrwwd.zia49kiu5096aq0p \
    --discovery-token-ca-cert-hash sha256:2b22b8c62774bdfd051720326ccb49970457140a19ec9f425c28727ef4b4dae9
sudo sysctl net.bridge.bridge-nf-call-iptables=1
```

You can monitor the status of the node via:

```bash
kubectl get nodes
```

When all are added this command's output should show all nodes as Ready:

```bash
NAME     STATUS   ROLES    AGE     VERSION
master   Ready    master   18m     v1.17.3
node1    Ready    <none>   5m47s   v1.17.3
node2    Ready    <none>   102s    v1.17.3
node3    Ready    <none>   63s     v1.17.3
```

# Accessing Kubernetes from Laptop

As it stands the Kubernetes cluster is only available on the cluster's network `10.0.1.0` and only `master` has the config to do so, so to access it from a machine on the host network we need to do some additional config.

## Gateway

First we want to make sure the gateway has the tools to admin the K8S cluster, as this will be the easiest box to SSH onto from a new host network. To do this we need to copy the config from `master` onto the gateway RPi:

```bash
scp -r pi@master:~/.kube ~/
kubectl get nodes
```

## Laptop

Using WSL, we can copy the `.kube` folder in a similar way to the gateway:

```bash
scp -r pi@<gateway-ip>:~/.kube ~/
```

You will also need to add a routing rule so that all the `10.0.1.x` traffic is routed through your Gateway RPi.

On Windows (will be picked up by WSL):
```powershell
route ADD 10.0.1.0 MASK 255.255.255.0 <gateway-ip>
```

However, executing `kubectl get nodes` will result in an error as the Gateway RPi is not forwarding the appropriate traffic.

To enable the kubernetes tools access from host network we need to enable port forwarding off `6443`, `ssh` on the Gateway RPi:

```bash
# Prepare port forwarding of eth1 traffic on 6443 to master (10.0.1.2)
sudo iptables -t nat -A PREROUTING -p tcp -i eth1 --dport 6443 -j DNAT --to-destination 10.0.1.2:6443
sudo iptables -A FORWARD -p tcp -i eth1 -d 10.0.1.2 --dport 6443 -j ACCEPT
# Prepare port forwarding of wlan0 traffic on 6443 to master (10.0.1.2)
sudo iptables -t nat -A PREROUTING -p tcp -i wlan0 --dport 6443 -j DNAT --to-destination 10.0.1.2:6443
sudo iptables -A FORWARD -p tcp -i wlan0 -d 10.0.1.2 --dport 6443 -j ACCEPT
# Do the routing, send the pack out on 10.0.1.1
sudo iptables  -t nat -A POSTROUTING -o 10.0.1.1 -j SNAT --to-source 10.0.1.2
sudo sh -c "iptables-save > /etc/iptables.ipv4.nat"
```

Your machine on the host network should now be able to access kubernetes via the tooling. For example, the VS Code Kubernetes extension should automatically pick up the configuration and allow you to browse the RPi Kubernetes cluster.
