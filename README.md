# system-info

System information: cpu load, disk usage

this plug-in provides three asynchronous functions that can be used
in expressions for stored calculated variables, in insert_any_row
actions or other places where asynchronous expressions can be used in
Saltcorn.

- `cpu_usage()` the current CPU load. this is a number between zero
  and the number of CPU cores in the system.
- `drive_usage()` the percentage of your available disk space used, 0-100
- `mem_usage()` the percentage of your available memory (RAM) used, 0-100

Any arguments supplied to these functions will be ignored.

### Example usage

I use these functions to continuously monitor capacity on a Saltcorn
server. To do this:

Create a table with the following fields:

- cpu: type Float
- disk: type Float
- mem: type Float
- time: type Date

Then under the Settings-> Actions menu create an insert_any_row action,
when = Often (which means every 5 minutes). in the configuration for
the action, select the table with the fields described above, and the following row expression:

```
{
    disk:drive_usage(),
    time:new Date(),
    memory:mem_usage(),
    cpu:cpu_usage()
}
```

Click the test run to make sure no errors occurred.

then you can install the "visualize" plug-in and create new view
with the template RelationsVis, and the table created above, with time
chosen as the X axis and one of the fields /cpu/mem/disk as the Y axis
with the style set to "lines." Create one plot for each of the three
fields. You can then display these plots onto one page
