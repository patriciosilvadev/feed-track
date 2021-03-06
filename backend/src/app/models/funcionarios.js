const path = require('path');
const moment = require('moment');
const { BaseModel } = require('../../database/base-model');

class Funcionarios extends BaseModel {
    static get tableName() {
        return 'funcionarios';
    }

    static get labelName() {
        return 'Funcionário';
    }

    static get idColumn() {
        return 'id';
    }

    static get modifiers() {
        return {
            ...super.modifiers,
            withOutPass(builder) {
                builder.select('id', 'nome', 'email', 'nascimento', 'desativado');
            },
        };
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['nome', 'email', 'senha'],
            properties: {
                id: { type: 'integer' },
                nome: { type: 'string', minLength: 1, maxLength: 240 },
                foto: { type: 'string' },
                sexo: {
                    type: 'string', maxLength: 1, enum: ['m', 'f'],
                },
                email: { type: 'email' },
                nascimento: { type: 'string', format: 'date' },
                senha: { type: 'string' },
                desativado: { type: 'number' },
            },
        };
    }

    static get relationMappings() {
        /* eslint import/no-dynamic-require: 0 */
        const Permissoes = require(path.resolve(this.modelPaths, 'permissoes.js'));
        const Feedbacks = require(path.resolve(this.modelPaths, 'feedbacks.js'));
        const Cargos = require(path.resolve(this.modelPaths, 'cargos.js'));
        const SystemLogs = require(path.resolve(this.modelPaths, 'system-logs.js'));

        return {
            permissoes: {
                relation: BaseModel.ManyToManyRelation,
                modelClass: Permissoes,
                join: {
                    from: 'funcionarios.id',
                    through: {
                        from: 'funcionarios_permissoes.funcionario',
                        to: 'funcionarios_permissoes.permissao',
                    },
                    to: 'permissoes.id',
                },
            },
            feedbacks: {
                relation: BaseModel.HasManyRelation,
                modelClass: Feedbacks,
                join: {
                    from: 'funcionarios.id',
                    to: 'feedbacks.funcionario',
                },
            },
            cargos: {
                relation: BaseModel.ManyToManyRelation,
                modelClass: Cargos,
                join: {
                    from: 'funcionarios.id',
                    through: {
                        from: 'filiais_funcionarios.funcionario',
                        to: 'filiais_funcionarios.cargo',
                    },
                    to: 'cargos.id',
                },
            },
            system_logs: {
                relation: BaseModel.HasManyRelation,
                modelClass: SystemLogs,
                join: {
                    from: 'funcionarios.id',
                    to: 'system_logs.referencia',
                },
            },
            inserted: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: SystemLogs,
                join: {
                    from: 'funcionarios.id',
                    to: 'system_logs.referencia',
                },
            },
            updated: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: SystemLogs,
                join: {
                    from: 'funcionarios.id',
                    to: 'system_logs.referencia',
                },
            },
        };
    }

    static async get({
        id,
        limit,
        search,
        page,
        nome,
        email,
        nascimento,
    }) {
        const query = this.query()
        // eslint-disable-next-line max-len
            .select('funcionarios.id', 'funcionarios.nome', 'funcionarios.email', 'funcionarios.nascimento', 'funcionarios.sexo', 'funcionarios.foto', 'funcionarios.desativado')
            .where('funcionarios.desativado', 0);

        query.eagerAlgorithm(this.JoinEagerAlgorithm)
            .eager(`
                    [permissoes, 
                    inserted(funcionarios, onlyInsert).funcionario(withOutPass),
                    updated(funcionarios, lastUpdate).funcionario(withOutPass)]
                `);

        if (id && id !== 0) {
            query.where('funcionarios.id', id);
        } else {
            query.orderBy('inserted.criacao', 'asc');
        }

        const format_nascimento = moment(nascimento, 'DD/MM/YYYY');
        const format_nascimento_search = format_nascimento.format('YYYY-MM-DD');

        if (search !== null) {
            // eslint-disable-next-line func-names
            query.andWhere(function () {
                const format_date = moment(search, 'DD/MM/YYYY');
                const format_date_search = format_date.format('YYYY-MM-DD');

                if (format_date.isValid()) {
                    this.orWhere('funcionarios.nascimento', 'like', `%${format_date_search}%`);
                }
                this.orWhere('funcionarios.nome', 'like', `%${search}%`);
                this.orWhere('funcionarios.email', 'like', `%${search}%`);
            });
        }

        if (nascimento !== null && format_nascimento.isValid()) {
            query.where('funcionarios.nascimento', 'like', `%${format_nascimento_search}%`);
        }

        if (nome !== null) {
            query.where('funcionarios.nome', 'like', `%${nome}%`);
        }

        if (email !== null) {
            console.log(email);
            query.where('funcionarios.email', 'like', email);
        }

        if (limit && limit !== null) {
            query.limit(limit);
        }

        if (page && page !== 1 && limit !== null) {
            query.offset(page * limit - limit);
        }

        if (id && id !== 0) {
            return query.first().then();
        }

        if (email && email !== null) {
            return query.first().then();
        }

        const results = await query.then();

        const total = await query.groupBy('id').resultSize();

        return {
            results,
            total,
        };
    }

    static async save(funcionario) {
        if (funcionario.id) {
            const funcionario_database = await this.query()
                .select('*').where('id', funcionario.id).first();

            if (funcionario_database && funcionario_database.id) {
                // eslint-disable-next-line no-param-reassign
                funcionario = { ...funcionario_database, ...funcionario };

                return this.query().upsert(funcionario, funcionario_database)
                    .then((result) => {
                        if (result) {
                            return result;
                        }
                        return true;
                    });
            }
            throw 'Não foi possível atualizar funcionario!';
        }

        return this.query().upsert(funcionario)
            .then((result) => {
                if (result) {
                    return result;
                }
                return true;
            });
    }

    static async softDelete({ id }) {
        const funcionario = await this.query().select('*').where('id', id).where('desativado', '=', '0')
            .first();

        if (funcionario && funcionario.id) {
            funcionario.desativado = 1;

            return this.query().soft(funcionario)
                .then();
        }
        throw 'Não foi possível excluir funcionario!';
    }
}

module.exports = Funcionarios;
