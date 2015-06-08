exports.render = function(input, out) {
    var range = input.range;
    var collection = input.collection;
    var render = input.renderBody;
    var i = 0;
    var n = range.length;
    var item;
    for (; i < n; i += 1) {
        if (item = collection[i]) {
            out.write('\n' + range[i] + '.');
            render(out, item);
        } else {
            break;
        }
    }
    if (n < collection.length) {
        input.params.paging[i] = item;
        out.write('\n' + (range[n-1] + 1) + '.Next');
    }
};
