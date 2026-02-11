---
title: "Automatic Thumbnail and Cover Images"
description: "Randomly assigning cover images from a gallery pool at publish time in Hugo"
pubDate: 2020-02-12
tags: ["hugo", "web-development", "automation"]
source: "hugo"
originalUrl: "https://codifice.blog/automatic-thumbnail-and-cover-images"
---

# Randomly Assign Cover Image from a Pool at Publish

In CMS terms the Cover image is a banner-like image that appears towards the top of the article to provide some interest where the thumbnail image is used when linking to the article, such as the Recent Posts list on the Homepage.

I prefer that these are related in some way to provide some visual context/confirmation for the user. So that if they click on a link with a picture of a flower they should see the same flower immediately upon that page loading.

Unfortunately, most of the images that I'd be creating myself will be code related and pretty boring and I didn't want a manual chore to link specific images. So I decided to customize the site to enable a random high quality stock image to be assigned to each page when the site is published. This image will then be the basis for an automatically generated Cover and Thumbnail image.

## How does it work? Layouts and Scratch

* Create themed Gallery Page Bundles to contain the relevant stock images
* Link posts to a particular gallery in the post "Front Matter" (metadata at the top of each content file), similar to `thumbnail: "/coding-gallery"` where "/coding-gallery" is the absolute path of the gallery page.
* Create layouts to select an image for the post from the related gallery, store it against the Post for reference and then generate the needed cropped and sized version of the image.

For example, the layout of the "Recent Posts" on the homepage uses Hugo's scratch functionality to cache selected images and generate thumbnails on the fly.

To ensure that the same image is reused for each reference of the post we store the selected image reference against the in-memory model of the post in the Scratch map. We also cache resized file reference to prevent processing the same image multiple times during publish.
