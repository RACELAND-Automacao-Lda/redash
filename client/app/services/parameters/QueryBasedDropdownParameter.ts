import { isNull, isUndefined, isArray, isEmpty, get, map, join, has } from "lodash";
import { Query } from "@/services/query";
import Parameter from "./Parameter";

class QueryBasedDropdownParameter extends Parameter {
  multiValuesOptions: any;
  name: any;
  parentQueryId: any;
  queryId: any;
  urlPrefix: any;
  value: any;
  constructor(parameter: any, parentQueryId: any) {
    super(parameter, parentQueryId);
    this.queryId = parameter.queryId;
    this.multiValuesOptions = parameter.multiValuesOptions;
    this.setValue(parameter.value);
  }

  normalizeValue(value: any) {
    if (isUndefined(value) || isNull(value) || (isArray(value) && isEmpty(value))) {
      return null;
    }

    if (this.multiValuesOptions) {
      value = isArray(value) ? value : [value];
    } else {
      value = isArray(value) ? value[0] : value;
    }
    return value;
  }

  getExecutionValue(extra = {}) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'joinListValues' does not exist on type '... Remove this comment to see the full error message
    const { joinListValues } = extra;
    if (joinListValues && isArray(this.value)) {
      const separator = get(this.multiValuesOptions, "separator", ",");
      const prefix = get(this.multiValuesOptions, "prefix", "");
      const suffix = get(this.multiValuesOptions, "suffix", "");
      const parameterValues = map(this.value, v => `${prefix}${v}${suffix}`);
      return join(parameterValues, separator);
    }
    return this.value;
  }

  toUrlParams() {
    const prefix = this.urlPrefix;

    let urlParam = this.value;
    if (this.multiValuesOptions && isArray(this.value)) {
      urlParam = JSON.stringify(this.value);
    }

    return {
      [`${prefix}${this.name}`]: !this.isEmpty ? urlParam : null,
    };
  }

  fromUrlParams(query: any) {
    const prefix = this.urlPrefix;
    const key = `${prefix}${this.name}`;
    if (has(query, key)) {
      if (this.multiValuesOptions) {
        try {
          const valueFromJson = JSON.parse(query[key]);
          this.setValue(isArray(valueFromJson) ? valueFromJson : query[key]);
        } catch (e) {
          this.setValue(query[key]);
        }
      } else {
        this.setValue(query[key]);
      }
    }
  }

  loadDropdownValues() {
    if (this.parentQueryId) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'associatedDropdown' does not exist on ty... Remove this comment to see the full error message
      return Query.associatedDropdown({ queryId: this.parentQueryId, dropdownQueryId: this.queryId }).catch(() =>
        Promise.resolve([])
      );
    }

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'asDropdown' does not exist on type 'type... Remove this comment to see the full error message
    return Query.asDropdown({ id: this.queryId }).catch(Promise.resolve([]));
  }
}

export default QueryBasedDropdownParameter;