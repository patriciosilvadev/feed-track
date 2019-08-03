module.exports = (app) => {
    const select = async (req, res) => {
        const id = req.query.id || req.params.id || 0;
        const limit = req.query.limit || null;
        const search = req.query.search || null;
        const page = req.query.page || 1;

        const data = {
            id,
            limit,
            search,
            page,
        };

        try {
            const result = await app.models.permissoes.get(data);

            res.json(result);
        } catch (msg) {
            res.status(400).send('Bad request');
        }
    };

    const save = async (req, res) => {
        const { permissao } = req.body;

        if (req.params.id) permissao.id = Number(req.params.id);

        try {
            if (permissao.id === undefined && permissao.permissao.trim() === '') {
                // eslint-disable-next-line no-throw-literal
                throw 'Descrição inválida!';
            }

            const result = await app.models.permissoes.save(permissao);

            if (result === true) {
                res.sendStatus(204);
            } else {
                res.json(result);
            }
        } catch (msg) {
            res.status(400).send(msg);
        }
    };

    const softDelete = async (req, res) => {
        const { id } = req.params;

        const data = {
            id,
        };

        try {
            const result = await app.models.permissoes.softDelete(data);

            if (result) {
                res.sendStatus(204);
            }
        } catch (msg) {
            res.sendStatus(400).send(msg);
        }
    };

    return { select, save, softDelete };
};