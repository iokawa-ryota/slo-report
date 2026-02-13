import { describe, expect, it } from 'vitest';
import {
  MACHINE_CONFIG,
  MACHINE_OPTIONS,
  FALLBACK_MACHINE,
  MACHINE_SECTION_VALUES,
  DETAIL_VARIANT_VALUES,
  getMachineConfig
} from './machineConfig';

describe('machineConfig rules', () => {
  it('keeps fallback machine and returns it for unknown machine', () => {
    expect(MACHINE_CONFIG[FALLBACK_MACHINE]).toBeDefined();
    expect(getMachineConfig('__unknown_machine__')).toEqual(MACHINE_CONFIG[FALLBACK_MACHINE]);
  });

  it('keeps all options resolvable', () => {
    for (const machineName of MACHINE_OPTIONS) {
      expect(getMachineConfig(machineName)).toEqual(MACHINE_CONFIG[machineName]);
    }
  });

  it('uses allowed enum values for machineSection and detailVariant', () => {
    for (const config of Object.values(MACHINE_CONFIG)) {
      expect(MACHINE_SECTION_VALUES).toContain(config.machineSection);
      expect(DETAIL_VARIANT_VALUES).toContain(config.detailVariant);
      expect(typeof config.detailFields.mid).toBe('boolean');
      expect(typeof config.detailFields.right).toBe('boolean');
    }
  });
});
