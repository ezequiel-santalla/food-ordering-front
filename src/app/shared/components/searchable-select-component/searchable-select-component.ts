import {
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  templateUrl: './searchable-select-component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true,
    },
  ],
  host: {
    '(document:click)': 'onClickOutside($event)',
  },
})
export class SearchableSelectComponent implements ControlValueAccessor {

  options = input<SelectOption[]>([]);
  placeholder = input<string>('Seleccioná una opción');
  disabledPlaceholder = input<string>('Seleccioná primero la opción anterior');

  searchText = signal('');
  isOpen = signal(false);
  isDisabled = signal(false);
  selectedId = signal<number | null>(null);

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  selectedName = computed(() => {
    const id = this.selectedId();
    const opts = this.options();
    if (!id || opts.length === 0) return '';
    return opts.find(o => o.id === id)?.name || '';
  });

  filteredOptions = computed(() => {
    const search = this.searchText().toLowerCase();
    return this.options().filter(o => o.name.toLowerCase().includes(search));
  });

  currentPlaceholder = computed(() => {
    if (this.selectedName()) return this.selectedName();
    if (this.isDisabled()) return this.disabledPlaceholder();
    return this.placeholder();
  });

  onClickOutside(event: MouseEvent) {
    const el = event.target as HTMLElement;
    if (!el.closest('app-searchable-select')) {
      this.closeDropdown();
    }
  }

  onSearchInput(target: EventTarget | null) {
    this.searchText.set((target as HTMLInputElement).value);
    this.isOpen.set(true);
  }

  toggleDropdown() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) this.searchText.set('');
  }

  openDropdown() {
    this.isOpen.set(true);
    this.searchText.set('');
  }

  closeDropdown() {
    this.isOpen.set(false);
    this.searchText.set('');
  }

  selectOption(option: SelectOption) {
    this.selectedId.set(option.id);
    this.searchText.set('');
    this.isOpen.set(false);
    this.onChange(option.id);
    this.onTouched();
  }

  writeValue(value: number | null): void {
    this.selectedId.set(value);
    if (!value) this.searchText.set('');
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
