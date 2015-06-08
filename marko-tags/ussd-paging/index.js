exports.render = function(input, out) {
    out = out.beginAsync();
    if(!input.params.system.paging) {
        input.params.system.paging = {items: {}, next: null, page: 1}
    }
    var range = input.range;
    var collection = input.collection;
    var render = input.renderBody;
    var n = range.length;
    var i = 0;
    var item;
    var index;
    input.params.system.paging.items = {};
    for (; i < n; i += 1) {
        if (item = collection[input.params.system.paging.page * n - n + i]) {
            index = range[i];
            input.params.system.paging.items[index] = item;
            out.write('\n' + index + '.');
            render(out, item);
        } else {
            break;
        }
    }
    if (i == n) {
        index = range[n - 1] + 1;
        input.params.system.paging.next = index;
        out.write('\n' + index + '.Next');
        out.end();
    } else {
        input.params.system.paging.next = null;
        out.end();
    }
};
