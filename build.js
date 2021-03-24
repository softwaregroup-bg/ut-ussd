require('ut-run').run({
    method: 'types',
    main: () => [[{
        main: require.resolve('./'),
        pkg: require.resolve('./package.json')
    }]],
    config: {
        utUssd: true,
        utRun: {
            types: {
                dependencies: '',
                validation: 'utUssd.validation',
                error: 'utUssd.error'
            }
        }
    }
});
