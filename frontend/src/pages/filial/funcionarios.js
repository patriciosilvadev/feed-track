import React, { useState, useEffect } from 'react';
import { Field, Formik } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';
import StyledTable from '../../components/styled-table';
import api from '../../services/api';
import { FieldContainer, Row, Subtitle } from '../common-styles';
import { Form } from './style';
import TogglableContent from '../../components/togglable-content';
import ControlledInput from '../../components/controlled-input';
import { parser } from '../../util/select-parser';
import Button from '../../components/button';
import { error, loading, success } from '../../components/alerts';
import { confirmAlert } from '../../components/confirm-alert';

function Funcionarios({ history, filial }) {
    const [defaultOptionsFuncionarios, setDefaultOptionsFuncionarios] = useState([]);
    const [defaultOptionsCargos, setDefaultOptionsCargos] = useState([]);
    const [filial_funcionario, setFilialFuncionario] = useState({});
    const [updateTable, setUpdateTable] = useState(false);
    const [hiddenFormOpen, setHiddenFormOpen] = useState(false);

    const initialValues = filial_funcionario || {
        funcionario: '',
        cargo: '',
    };

    async function loadFuncionarios(search, callback = null) {
        const params = {
            nome: search || '',
        };

        const funcionarios = await api.get('funcionarios', {
            params,
        });

        const options = parser('nome', 'id', funcionarios.data.results);

        if (callback) {
            callback(options);
        }

        return options;
    }

    async function loadCargos(search, callback = null) {
        const params = {
            descricao: search || '',
        };

        const cargos = await api.get('cargos', {
            params,
        });

        const options = parser('descricao', 'id', cargos.data.results);

        if (callback) {
            callback(options);
        }

        return options;
    }

    async function getFuncionarios(data) {
        if (filial && filial.id) {
            const funcionarios_filial = await api.get('filiais/funcionarios', {
                params: { ...data, filial: filial.id },
            });

            return funcionarios_filial;
        }
        return {};
    }

    useEffect(() => {
        const getDefaultOptions = async () => {
            const funcionarios = await loadFuncionarios();
            const cargos = await loadCargos();
            setDefaultOptionsFuncionarios(funcionarios);
            setDefaultOptionsCargos(cargos);
            // setLoading(false);
        };

        // setLoading(true);
        getDefaultOptions();
    }, []);

    const headers = [
        {
            name: 'Nome',
            accessor: 'funcionario_filial.nome',
            value: 'Nome',
        },
        {
            name: 'E-mail',
            accessor: 'funcionario_filial.email',
            value: 'E-mail',
        },
        {
            name: 'Data de Nascimento',
            accessor: 'funcionario_filial.nascimento',
            value: 'Data de Nascimento',
        },
        {
            name: 'Cargo',
            accessor: 'cargo_funcionario.descricao',
            value: 'Cargo',
        },
    ];

    const submenuOption = tableInfo => [
        {
            description: 'Editar',
            icon: 'icon-edit',
            title: 'Editar',
            onClick(e) {
                setHiddenFormOpen(true);

                const filial_funcionario_edit = {
                    funcionario: {
                        value: tableInfo.original.funcionario_filial.id,
                        label: tableInfo.original.funcionario_filial.nome,
                    },
                    cargo: {
                        value: tableInfo.original.cargo_funcionario.id,
                        label: tableInfo.original.cargo_funcionario.descricao,
                    },
                    id: tableInfo.original.id,
                };

                setFilialFuncionario(filial_funcionario_edit);
            },
        }, {
            description: 'Excluir',
            title: 'Excluir',
            icon: 'icon-trash',
            onClick(e) {
                confirmAlert({
                    title: `Deseja excluir a relação do funcionário ${tableInfo.original.funcionario_filial.nome}?`,
                    message: `Ao confirmar a relação do funcionário ${tableInfo.original.funcionario_filial.nome} será excluída.`,
                    buttons: [
                        {
                            label: 'Sim',
                            onClick(e) {
                                const deleteFilialFuncionario = async () => {
                                    const loadAlert = loading('Excluindo feedback...');

                                    try {
                                        const deleted = await api.delete('/filiais-funcionarios', {
                                            params: {
                                                id: tableInfo.original.id,
                                            },
                                        });

                                        if (deleted.status === 204) {
                                            loadAlert();
                                            setUpdateTable(true);
                                            success('Relação excluída com sucesso!', moment().format('H:m:ss'));
                                            setUpdateTable(false);
                                        }
                                    } catch (e) {
                                        loadAlert();
                                        error('Erro ao excluir relação!');
                                    }
                                };

                                deleteFilialFuncionario();
                            },
                        },
                        {
                            label: 'Não',
                        },
                    ],
                });
            },
        },
    ];

    function makeForm({ handleSubmit, isSubmitting, resetForm }) {
        return (
            <Form onSubmit={handleSubmit}>
                <FieldContainer size={4}>
                    <Field
                        type="select"
                        type_select="async"
                        icon="icon-employee"
                        name="funcionario"
                        loadOptions={loadFuncionarios}
                        id="funcionario"
                        cacheOptions
                        defaultOptions={defaultOptionsFuncionarios}
                        label="Funcionário"
                        // defaultValue={initialValues.filial}
                        placeholder="Funcionário"
                        component={ControlledInput}
                    />
                </FieldContainer>
                <FieldContainer size={4}>
                    <Field
                        type="select"
                        type_select="async"
                        icon="icon-company"
                        name="cargo"
                        loadOptions={loadCargos}
                        id="cargo"
                        cacheOptions
                        defaultOptions={defaultOptionsCargos}
                        label="Cargo"
                        // defaultValue={initialValues.filial}
                        placeholder="Funcionário"
                        component={ControlledInput}
                    />
                </FieldContainer>
                <Button kind={isSubmitting ? 'disabled' : 'save'} type="submit" height="60px" label="Salvar" />
                <Button
                    kind={isSubmitting ? 'disabled' : 'cancel'}
                    onClick={() => {
                        setHiddenFormOpen(false);
                        resetForm();
                        setFilialFuncionario({});
                    }}
                    type="reset"
                    height="60px"
                    label="Cancelar"
                />
            </Form>
        );
    }

    return (
        <>
            <Row align="flex-start" align_items="center">
                <Subtitle>Funcionários desta Filial</Subtitle>
                <Button
                    kind="default"
                    label="Adicionar"
                    height="36px"
                    padding="6px 20px"
                    margin="0 0 0 15px"
                    onClick={() => setHiddenFormOpen(true)}
                />
            </Row>
            <TogglableContent isOpen={hiddenFormOpen}>
                <Formik
                    validationSchema={
                        Yup.object({
                            funcionario: Yup.mixed()
                                .required('Funcionário é obrigatório!'),
                            cargo: Yup.mixed()
                                .required('Cargo é obrigatório!'),
                        })
                    }
                    initialValues={initialValues}
                    onSubmit={async (values, { setSubmitting, resetForm, ...rest }) => {
                        const filial_funcionario_to_save = { ...values };

                        filial_funcionario_to_save.funcionario = filial_funcionario_to_save.funcionario.value;
                        filial_funcionario_to_save.cargo = filial_funcionario_to_save.cargo.value;
                        filial_funcionario_to_save.filial = filial.id;

                        const result = await api.post('/filiais-funcionarios', {
                            filial_funcionario: filial_funcionario_to_save,
                        });

                        function saveStatus(status_message) {
                            setSubmitting(false);
                            setUpdateTable(true);
                            success(`Relação ${status_message} com sucesso!`);
                            setUpdateTable(false);
                            resetForm();
                            setFilialFuncionario({});
                            setHiddenFormOpen(false);
                        }

                        if (result.status === 200 && !filial_funcionario_to_save.id) {
                            saveStatus('cadastrada');
                        } else if (result.status === 200 && filial_funcionario_to_save.id) {
                            saveStatus('atualizada');
                        } else {
                            setSubmitting(false);
                            error('Erro ao atualizar relação!');
                        }
                    }}
                >
                    {makeForm}
                </Formik>
            </TogglableContent>
            <StyledTable
                headers={headers}
                fireFetch={updateTable}
                submenuOption={submenuOption}
                data_function={getFuncionarios}
                clickHandler={(state, rowInfo, column, instance) => {
                    if (history && rowInfo.original) {
                        history.push(`/funcionario/${rowInfo.original.id}`);
                    }
                }}
                noDataText="Nenhum funcionário registrado nessa filial."
            />
        </>
    );
}

export default Funcionarios;
