import { AbstractControl, FormGroup, ValidationErrors } from "@angular/forms";

export class FormUtils {

  static emailPattern = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';

  static isValidField(form: FormGroup, fieldName: string): boolean | null {
    return (
      !!form.controls[fieldName].errors && form.controls[fieldName].touched
    );
  };

  static isPasswordOneEqualsPasswordTwo(pass1: string, pass2: string): (formGroup: AbstractControl) => { [key: string]: boolean } | null {
    return (formGroup: AbstractControl) => {

      const value1 = formGroup.get(pass1)?.value;
      const value2 = formGroup.get(pass2)?.value;

      return value1 === value2 ? null : { passwordsNotEqual: true };
    }
  };

  static isStartDateBeforeEndDate(startDate: string, endDate: string): (formGroup: AbstractControl) => { [key: string]: boolean } | null {
    return (formGroup: AbstractControl) => {

      const start = new Date(formGroup.get(startDate)?.value);
      const end = new Date(formGroup.get(endDate)?.value);

      return start < end ? null : { startDateAfterEndDate: true };
    }
  };

  static formatPhoneNumber(phone: string): string | null {
    // Remover espacios y guiones
    let cleaned = phone.replace(/[\s\-()]/g, '');

    // Si comienza con +54, reemplazar con 0
    if (cleaned.startsWith('+54')) {
      cleaned = '0' + cleaned.slice(3);
    }

    // Si comienza con 54 (sin +)
    if (cleaned.startsWith('54') && !cleaned.startsWith('0')) {
      cleaned = '0' + cleaned.slice(2);
    }

    // Validar que sea un número argentino válido (10 dígitos mínimo)
    if (!/^0\d{9,}$/.test(cleaned)) {
      console.warn('⚠️ Número de teléfono inválido:', phone);
      return null;
    }

    // Devolver en formato +54 9...
    return '+54' + cleaned.slice(1);
  }

  static getTextError(form: FormGroup, fieldName: string): string | null {
    if (!form.controls[fieldName]) return null;

    const errors = form.controls[fieldName].errors ?? {};

    for (const key of Object.keys(errors)) {
      switch (key) {
        case 'required':
          return 'Este campo es obligatorio.';

        case 'minlength':
          return `Debe tener al menos ${errors[key].requiredLength} caracteres.`;

        case 'maxlength':
          return `No puede exceder los ${errors[key].requiredLength} caracteres.`;

        case 'pattern':
          if (errors['pattern'].requiredPattern === FormUtils.emailPattern) {
            return 'El valor ingresado no luce como un correo electrónico.';
          }

          return 'El formato del campo es incorrecto.';

        case 'emailTaken':
          return 'El correo electrónico ya está en uso por otro usuario.';

        case 'startDateAfterEndDate':
          return 'La fecha de inicio debe ser anterior a la fecha de finalización.';

        default:
          return `Error de validación no controlado. ${key}`;
      }
    };

    return null;
  }

  public static passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ notSame: true });
      return { notSame: true };
    }

    if (confirmPassword.hasError('notSame')) {
      confirmPassword.setErrors(null);
    }

    return null;
  }
}
