---
title: "RPi Cluster (Part 3) - Networking"
description: "Configuring isolated cluster networking with dnsmasq DHCP, gateway setup, and firewall rules"
pubDate: 2020-02-18
tags: ["kubernetes", "raspberry-pi", "networking", "devops"]
source: "hugo"
originalUrl: "https://codifice.blog/rpi-cluster-part-3-networking"
---

# Configuring the RPi Cluster Network

Now that the cluster is configured and all the RPi's are up and running, it's time to sort out the networking so that the cluster operates on its own, predictable network and external connectivity is through a single Gateway.

We're going to configure the gateway RPi (which is doing double duty as the cache RPi in my case) to be a DHCP server using `dnsmasq` for all the devices connected to the 5 Port Switch which is serving as our backplane.

## Steps to Configure

### On the Gateway RPi

Install the dnsmasq software, but stop the service until we've configured it correctly:

```bash
sudo apt install dnsmasq
sudo systemctl stop dnsmasq
```

Assign a static IP address (`10.0.1.1`) to `eth0` (the onboard ethernet port - connected to the 5 port switch) by adding the following to the end of `/etc/dhcpcd.conf`:

```plain
interface eth0
        static ip_address=10.0.1.1/24
```

Now we need to configure the DHCP server for the cluster. First backup the default config and create a new one:

```bash
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig
sudo nano /etc/dnsmasq.conf
```

Add the following config for `eth0` to assign IP's using the `10.0.1.100` - `10.0.1.200` pool:

```plain
# global options
domain-needed
bogus-priv
filterwin2k
expand-hosts
domain=cluster.lan
local=/cluster.lan/
listen-address=127.0.0.1
listen-address=10.0.1.1

interface=eth0
dhcp-range=10.0.1.100,10.0.1.200,255.255.255.0,24h
dhcp-option=option:router,10.0.1.1

dhcp-host=master,10.0.1.2
```

> The last line will assign a static IP of 10.0.1.2 to any host named `master`

Finally restart the dnsmasq service with `sudo systemctl start dnsmasq`

### Configure the gateway to allow outwards communication

Back on the gateway RPi to activate the IP Forwarding:

```bash
sudo sysctl -w net.ipv4.ip_forward=1
```

Add a masquerade rules for `eth1` and `wlan0` and then save the rules:

```bash
sudo iptables -t nat -A  POSTROUTING -o eth1 -j MASQUERADE
sudo iptables -t nat -A  POSTROUTING -o wlan0 -j MASQUERADE
sudo iptables -A FORWARD -i eth0 -j ACCEPT
sudo iptables -A FORWARD -m state --state RELATED,ESTABLISHED -j ACCEPT
sudo sh -c "iptables-save > /etc/iptables.ipv4.nat"
```

To restore these settings on reboot, we need to enable IP forwarding, edit `/etc/sysctl.conf`:

```plain
net.ipv4.ip_forward=1
```

and edit `/etc/rc.local` and add the line below above "exit 0":

```plain
iptables-restore < /etc/iptables.ipv4.nat
```

## Disable WIFI on cluster RPis and SSH via Jumpbox

We need to disable the WiFi adapter to isolate the cluster RPi's...but if we do that we can no longer SSH onto the box directly.

So before we disable the adapter we will need to SSH into the node via the gateway RPi as a jumpbox:

```bash
ssh -J pi@<gateway-ip> pi@master
```

For Windows users, try using `Windows Subsystem for Linux` (WSL) to use linux SSH tools.

So...to disable the `wlan0` adapter:

```bash
rfkill block wifi
```

> You can unblock wifi again with `rfkill unblock wifi`

## Summary

We've now configured the RPi cluster network to isolate the RPi's behind a single gateway and enable the cluster-as-an-appliance network isolation. We can add the cluster to a network by either joining the gateway RPi to the host WIFI network or by patching in via the `eth1` port.
