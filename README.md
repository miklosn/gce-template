# gce-template

The program queries the [Google Compute Engine API](https://cloud.google.com/compute/docs/reference/rest/v1/) and merges the received data with a user specified template. It can output the results to the standard output or it can update a file (eg. configuration file) on the filesystem. It also supports a 'watch' mode, continously polling for changes and it can run a user specified shell command when it detects a change.

## Getting started

### Installation

1. Download a binary for your platform from the [releases page](https://github.com/miklosn/gce-template/releases).

2. Make it executable and place it somewhere on PATH.

3. Ensure authentication is set up (see below).

### Authentication

`gce-template` only supports the so-called [Application Default Credentials](https://cloud.google.com/docs/authentication/production). This means that either:

* pass a service account key file in the `GOOGLE_APPLICATION_CREDENTIALS` environment variable, or
* run the program on a GCE VM which has a default service account set up with the neccessary privileges, or
* have `gcloud` set up with neccessary permissions and Application Default Credentials initalized with `gcloud auth application-default login`.

### Templating basics

`gce-template` can process a template from `stdin` or from an input file as command line argument. By default, it outputs to `stdout` but an output path can also be specified with the `-o` or `--output` parameter.

The program integrates the [Nunjucks](https://mozilla.github.io/nunjucks/templating.html) engine from Mozilla which can be considered a port of jinja2, well known for it's wide use in Ansible circles if not for else.

The template receives input from various data sources from the program, one of these is called `vms` which is available by default and contains information about virtual machines on GCE, in the form of a dictionary keyed to self-links.

With this knowledge, we can now output everything we know about our vms with the [`dump`](https://mozilla.github.io/nunjucks/templating.html#dump) function:

```shell
$ echo "{{ vms | dump(2) }}" | gce-template
```

The `dump` filter is useful for discovering what is actually available in our data sources.

Another data source we have available is called `disks`, again available as a dictionary. This means we can "join" our data sources in the templates. The following example iterates through the virtual machines, and outputs a comma separated inventory with the total size of the attached disks rolled up. Create a template file called `inventory_rollup.j2` (you can use any extension).

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
$ gce-template -o inventory.csv inventory_rollup.j2
```

Now we are getting somewhere! `gce-template` applies various transformations to the data received from the GCE API, like converting fields to proper data types, simplifying presentation and removing unneccessary clutter.

## Usage

The `-h` or `--help` command line flag lists all options:

```shell
$ gce-template -h
```

The `-v` or `--verbose` flag is available for verbose output on stderr.

### Watch mode (`-w` and `--onchange`)

`gce-template` supports *watch mode*, in which it keeps itself in the foreground monitoring the data sources for changes, and in case of a change, triggering generating the output.

A not uncommon scenario would be to use `gce-template` to provide configuration for services that do not support dynamic discovery natively. The following example generates (half) a haproxy configuration, utilizing the [macro](https://mozilla.github.io/nunjucks/templating.html#macro) feature to provide a function to render backend groups based on metadata label selectors.

```django
{% macro service_group(service_group, port) %}
backend {{ service_group }}
  mode tcp
  balance roundrobin
  {% for _, vm in vms %}
  {% if vm.labels.service_group == service_group %}
  server {{ vm.name }} {{vm.networkInterfaces[0].networkIP}}:{{port}} check
  {%endif%}
  {% endfor %}
{% endmacro %}

frontend my-first-group
  bind *:3306
  mode tcp
  default_backend my-service-group

{{ service_group ('my-first-group', '3306') }}

frontend my-second-group
  bind *:3307
  mode tcp
  default_backend my-service-group

{{ service_group ('my-second-group', '3306') }}
```

To enable watch mode, use `-w <seconds>` or `--watch <seconds>`, with seconds being mandatory and specifying the time to wait between polls.

```shell
$ gce-template -o /etc/haproxy/haproxy.cfg -w 100 /etc/haproxy/haproxy.tmpl
```

> The Compute Engine Default API limit is 20/sec, metered every 100 seconds (so actually 2000/100 sec), keep this in mind when deploying to production. I would probably consider 100 seconds polling time appropriate for things like detecting auto scaled instances, with the value playing nicely with Google's limits.

The program also supports running an user-specified shell command when a change happens with the `--onchange <command>` option:

```shell
$ gce-template -o /etc/haproxy/haproxy.cfg -w 100 --onchange "systemctl reload haproxy" /etc/haproxy/haproxy.tmpl
```

The source template is compiled at startup time, so changing the source file while watch is running will *not* trigger a change event.

Furthermore, only input data that is actually referenced in the templates will trigger changes.

### Template engine

The program utilizes the powerful [Nunjucks](https://mozilla.github.io/nunjucks/templating.html) engine in a mode that makes most sense in this application. Blocks are stripped and trimmed (will not generate unnecessary whitespaces), autoescaping is disabled. *Never pull your templates blindly from someone else.*

The full power of Nunjucks is available, including child templates, blocks, extends and referencing other files relative to the template, even when processing a template through  standard input.

Furthermore, the [moment.js](https://momentjs.com/docs/#/displaying/) library is integrated as the `date` filter, adding a full range of datetime formatting and manipulation options.

`{{ vm.creationTimeStamp | date("add", 7, "days") | date }}`

### Data sources

The program currently supports the following data sources:

* vms
* disks

## Contributing

The project is still in it's infancy, rapidly developed in answer to real world frustrations. You can expect progress as it will be very useful in my work.

Contributions of all forms are welcome, including:

* use cases, examples
* feature requests
* bug reports
* code contributions

## License

`gce-template` is released under the MIT license.

Made with ❤️ in Jakarta.
