---
title: "RPi Cluster (Part 2) - Basic Configuration"
description: "Setting up headless installation, apt caching, log2ram, USB storage, and Docker for the Kubernetes cluster"
pubDate: 2020-02-17
tags: ["kubernetes", "raspberry-pi", "devops", "docker"]
source: "hugo"
originalUrl: "https://codifice.blog/rpi-cluster-part-2-basic-configuration"
---

# Basic Installation and Configuration

Before I get going on Kubernetes proper I wanted to make sure all the Pi's are essentially configured and updated to date. There are lots of guides out there for providing more detail, but the steps I'm running through are:

* Write the latest Raspbian Lite image to the MicroSD Cards ([Official Guide](https://www.raspberrypi.org/documentation/installation/installing-images/README.md))
* Enable headless install by enabling SSH access and providing WIFI details so RPi's can boot and be available on network ([Official Guide](https://www.raspberrypi.org/documentation/configuration/wireless/headless.md))
* Use DHCP (but with assigned IP's from router)

From this basic connectivity setup, will continue onto:

* Configure hostnames
* Configure the Gateway/Cache RPi to act as an `apt` caching using [`apt-cacher-ng`](https://geekflare.com/create-apt-proxy-on-raspberrypi/)
* Configure all RPi's Apt clients to use the `apt-cacher-ng` service
* Configure all RPi's to log to ram by default ([Log2Ram](https://github.com/azlux/log2ram))
* Bring all the RPi's up to date
* Mount USB Drive

At this point, I'll have all the RPi's communicating and up to date, but on my WIFI. This is great for the initial setup as I can connect to each RPi and configure in isolation. Ideally, I want the cluster to be on its own network segment and with Ethernet connectivity between the nodes.

* Switch cluster from WIFI to Ethernet with local switch
* Configure RPi 3b to act as gateway/firewall
* Deploy kubernetes

# Basic Customisation

After the RPi's have been flashed and are on the WiFi network, discover the assigned IP address of the RPi and connect using `ssh pi@<ip>` (or [Putty](https://www.putty.org)).

First thing to do is to update the default password (`passwd`)/create a new user and disable the default `pi` login.

> It's also a great idea to use key based authentication rather than a password... [instructions](https://www.digitalocean.com/community/tutorials/how-to-configure-ssh-key-based-authentication-on-a-linux-server)

## Configure Basic Node Settings

Next, we need to change the default hostname from `raspberrypi` to something more distinctive. We'll need to change this in two places:

```bash
sudo nano /etc/hostname
sudo nano /etc/hosts
```

In both files replace `raspberrypi` with your chosen name.

## Configure APT Cache

We now need to configure `apt` to use our cache RPi. To do this modify:
```bash
sudo nano /etc/apt/sources.list
```
and all files in `/etc/apt/sources.list.d` to redirect the requests to the cache server by adding `cache:3142/` after the `http://` for each uncommented line.

## Enable Logs Ram Disk

We can now install `log2ram` using the following:

```bash
echo "deb http://cache:3142/packages.azlux.fr/debian/ buster main" | sudo tee /etc/apt/sources.list.d/azlux.list
wget -qO - https://azlux.fr/repo.gpg.key | sudo apt-key add -
sudo apt update
sudo apt install log2ram
```

Reboot the RPi with `sudo reboot` and reconnect. Execute `df` and you should see log2ram mounted at `/var/log`.

## Mounting the USB Drive

To keep the cluster stable we want to avoid churning of data on the SD Card, so to this end we're going to mount a USB stick for the RPi to use.

* Plug in the stick
* Check you can see the new drive by `ls -l /dev/disk/by-uuid/`
* Reformat the USB Stick to ext4 (FAT doesn't support permissions)
* Create a new folder to mount the disk to `sudo mkdir /mnt/usb`
* Make a note of the UUID of the new partition (`sudo blkid /dev/sda1`)
* Edit fstab (`sudo nano /etc/fstab`) and add a line similar to:
```plain
UUID=<your-uuid> /mnt/usb ext4 defaults 0 0
```
* Mount the disk `sudo mount -a`
* Change owner from root (`sudo chown -R $USER:$USER /mnt/usb`)

## Installing Docker

The cluster nodes will all need Docker installed as a Kubernetes pre-requisite and the cache RPi will need it to serve as a read-through cache Docker Repo.

On each RPi, install docker leveraging the apt cache.

For improved compatibility, disable swap for kubernetes compatibility:

```bash
sudo dphys-swapfile swapoff && \
sudo dphys-swapfile uninstall && \
sudo update-rc.d dphys-swapfile remove && \
sudo systemctl disable dphys-swapfile.service
```

We also need to enable the following cgroups, by appending the parameters below to `/boot/cmdline.txt`:

```plain
cgroup_enable=cpuset cgroup_memory=1 cgroup_enable=memory
```

Reboot the RPi `sudo reboot`

## Summary

So far this has gotten us to a working Raspberry Pi cluster with apt caching and docker, ready for Kubernetes installation.
