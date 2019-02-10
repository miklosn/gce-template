# gce-template

The program queries the [Google Compute Engine API](https://cloud.google.com/compute/docs/reference/rest/v1/) and merges the received data with a user specified template. It can output the results to the standard output or it can update a file (eg. configuration file) on the filesystem. It also supports a 'watch' mode, continously polling for changes and it can run a user specified shell command when it detects a change.

# Getting started

## Installation

1. Download a binary for your platform from the [releases page](https://github.com/miklosn/gce-template/releases).

2. Make it executable and place it somewhere on PATH.

3. Ensure authentication is set up (see below).

## Authentication

`gce-template` only supports the so-called [Application Default Credentials](https://cloud.google.com/docs/authentication/production). This means that either:

* pass a service account key file in the `GOOGLE_APPLICATION_CREDENTIALS` environment variable, or
* run the program on a GCE VM which has a default service account set up with the neccessary privileges, or
* have `gcloud` set up with neccessary permissions and Application Default Credentials initalized with `gcloud auth application-default login`.

## Templating basics

`gce-template` can process a template from `stdin` or from an input file with the `-t` or `--template` command line parameter. By default, it outputs to `stdout` but an output path can also be specified with the `-o` or `--output` parameter.

The program integrates the [Nunjucks](https://mozilla.github.io/nunjucks/templating.html) engine from Mozilla which can be considered a port of jinja2, well known for it's wide use in Ansible circles if not for else.

The template receives input from various data sources from the program, one of these is called `vms` which is available by default and contains information about virtual machines on GCE, in the form of a dictionary keyed to self-links.

With this knowledge, we can now output everything we know about our vms with the [`dump`](https://mozilla.github.io/nunjucks/templating.html#dump) function:

```shell
$ echo "{{ vms | dump(2) }}" | gce-template
```

The `dump` filter is useful for discovering what is actually available in our data sources.

Another data source we have available is `disks`, again available as a dictionary. This means we can 'join' our data sources in the templates. The following example iterates through the virtual machines, and outputs an comma separated inventory with the total size of the attached disks rolled up. Create a template file called `inventory_rollup.j2`:

```django
Name,Zone,Machine type,Internal IP,Nat IP,Total disk
{% for _, vm in vms %}
    {% set total = 0 %}
    {% for disk in vm.disks %}
        {% set total = total + disks[disk.source].sizeGb %}
    {% endfor %}
    {{- vm.name }},{{vm.zone}},{{vm.machineType}},{{vm.networkInterfaces[0].networkIP}},{{vm.networkInterfaces[0].accessConfigs[0].natIP}},{{total}}
{% endfor %}
```
This time let's output it to a proper csv file:
```shell
$ gce-template -t inventory_rollup.j2 -o inventory.csv
```

Now we are getting somewhere! `gce-template` applies various transformations on the data received from the GCE API, like converting fields to proper data types, simplifying presentation and removing unneccessary clutter.