import React from 'react';
import styled from 'styled-components';
import CheckboxGroup from 'react-checkbox-group';
import { colors } from '../../../configs/styled-components-options';

const IconTag = props => (
    <i className={props.className} />
);

const Icon = styled(IconTag)`
    color: ${colors.white};
    height: 15px;
    left: calc(50% - (19.5px / 2));
    position: absolute;
    top: calc(50% - (21px / 2));
    width: 19.5px;
    
    ::before{
        font-size: 19.5px;
    }
`;

const StyledGroup = styled(CheckboxGroup)`
    display: flex;
    height: auto;
    width: auto;
`;

const GroupContainer = styled('div')`
    display: flex;
    flex-wrap: wrap;
    height: auto;
    justify-content: space-between;
    width: 100%;
`;

const InputLabel = styled('label')`
    align-items: center;
    display: flex;
    font-weight: bold;
    margin: ${props => props.margin};
    
    input[type="checkbox"] {
        appearance: none;
        background-color: ${props => (props.checked ? colors.green : colors.white)};
        border: 1px solid ${props => (props.show_error ? colors.red : 'transparent')};
        border-radius: 4px;
        box-shadow: 0 0 4px rgba(0,0,0,.2);
        height: 38px;
        position: relative;
        transition: .2s;
        width: 41px;
    }
`;

export {
    StyledGroup, InputLabel, GroupContainer, Icon,
};
