def load_weights_by_name(model, path, verbose=False):
    import h5py
    def load_model_weights(cmodel, weights):
        for layer in cmodel.layers:
            print(layer.name)
            if hasattr(layer, 'layers'):
                load_model_weights(layer, weights[layer.name])
            else:
                for w in layer.weights:
                    _, name = w.name.split('/')
                    if verbose:
                        print(w.name)
                    try:
                        w.assign(weights[layer.name][name][()])
                    except:
                        w.assign(weights[layer.name][layer.name][name][()])

    with h5py.File(path, 'r') as f:
        load_model_weights(model, f)
