# gce-template

The program queries the [Google Compute Engine API](https://cloud.google.com/compute/docs/reference/rest/v1/) and merges the received data with a user specified template. It can output the results to the standard output or it can update a file (eg. configuration file) on the filesystem. It also supports a 'watch' mode, continously polling for changes and it can run a user specified shell command when it detects a change.

# Getting started

## Installation

## Authentication

`gce-template` only supports the so-called [Application Default Credentials](https://cloud.google.com/docs/authentication/production). This means that either:

* pass a service account key json file in the `GOOGLE_APPLICATION_CREDENTIALS` environment variable, or
* run the program on a GCE VM which has a default service account set up with the neccessary privileges, or
* have `gcloud` set up with neccessary permissions and Application Default Credentials initalized with `gcloud auth application-default login`.

