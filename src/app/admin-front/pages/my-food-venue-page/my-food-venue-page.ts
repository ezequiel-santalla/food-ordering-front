import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FoodVenueService } from '../../services/food-venue-service';
import { FoodVenueAdminResponse } from '../../models/response/food-venue-reponse';
import { FoodVenueRequest } from '../../models/request/food-venue-request';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-food-venue-page',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './my-food-venue-page.html'
})
export class MyFoodVenuePage {

  venueForm!: FormGroup;
  loading: boolean = false;
  isEditing: boolean = false;

  selectedLogo: File | null = null;
  selectedBanner: File | null = null;
  logoPreview: string | null = null;
  bannerPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private foodVenueService: FoodVenueService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadVenueData();
  }

  initForm(): void {
    this.venueForm = this.fb.group({
      // Bloque: Información General (name, email, phone)
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],

      // Bloque: Dirección
      address: this.fb.group({
        street: ['', Validators.required],
        number: ['', Validators.required],
        city: ['', Validators.required],
        province: ['', Validators.required],
        postalCode: ['', Validators.required],
        country: ['', Validators.required]
      }),


      style: this.fb.group({

        slogan: ['', [Validators.maxLength(200)]],
        description: ['', [Validators.maxLength(1000)]],
        publicMenu: [false],

        primaryColor: [{ value: '#3b82f6', disabled: true }],
        secondaryColor: [{ value: '#8b5cf6', disabled: true }],
        accentColor: [{ value: '#f59e0b', disabled: true }],
        backgroundColor: [{ value: '#ffffff', disabled: true }],
        textColor: [{ value: '#000000', disabled: true }],

        // Imágenes
        logoUrl: [''],
        bannerUrl: [''],

        // Redes Sociales
        instagramUrl: [''],
        facebookUrl: [''],
        whatsappNumber: ['']
      })
    });
  }

loadVenueData(): void {
  this.loading = true;
  this.foodVenueService.getMyFoodVenue().subscribe({
    next: (data: FoodVenueAdminResponse) => {

      this.venueForm.patchValue({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address
      });

      const styleGroup = this.venueForm.get('style') as FormGroup;

      const styleData = data.venueStyle;

      if (styleGroup && styleData) {
        styleGroup.patchValue({

          instagramUrl: styleData.instagramUrl ?? '',
          facebookUrl: styleData.facebookUrl ?? '',
          whatsappNumber: styleData.whatsappNumber ?? '',

          slogan: styleData.slogan ?? '',
          description: styleData.description ?? '',
          publicMenu: styleData.publicMenu ?? false,

          primaryColor: styleData.primaryColor ?? '#3b82f6',
          secondaryColor: styleData.secondaryColor ?? '#8b5cf6',
          accentColor: styleData.accentColor ?? '#f59e0b',
          backgroundColor: styleData.backgroundColor ?? '#ffffff',
          textColor: styleData.textColor ?? '#000000',

          logoUrl: styleData.logoUrl ?? '',
          bannerUrl: styleData.bannerUrl ?? ''
        });
        this.logoPreview = styleData.logoUrl ?? null;
          this.bannerPreview = styleData.bannerUrl ?? null;
      }
      this.venueForm.disable();
      this.loading = false;
    },
    error: (err) => {
      console.error('Error al cargar datos del local', err);
      this.loading = false;
    }
  });
}
  toggleEdit(): void {
    this.isEditing = !this.isEditing;

    if (this.isEditing) {
      this.venueForm.enable();
      // El bloque de colores (Paleta de Colores) debe permanecer deshabilitado.
      this.venueForm.get('style.primaryColor')?.disable();
      this.venueForm.get('style.secondaryColor')?.disable();
      this.venueForm.get('style.accentColor')?.disable();
      this.venueForm.get('style.backgroundColor')?.disable();
      this.venueForm.get('style.textColor')?.disable();

    } else {
      // Si se cancela la edición, volvemos a cargar los datos originales
       this.selectedLogo = null;
      this.selectedBanner = null;
      this.loadVenueData();
      this.venueForm.disable();
    }
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedLogo = input.files[0];

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.logoPreview = e.target.result;
      };
      reader.readAsDataURL(this.selectedLogo);
    }
  }

  // ✅ NUEVO: Manejar selección de banner
  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedBanner = input.files[0];

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.bannerPreview = e.target.result;
      };
      reader.readAsDataURL(this.selectedBanner);
    }
  }

  // ✅ NUEVO: Remover logo
  removeLogo(): void {
    this.selectedLogo = null;
    this.logoPreview = null;
    this.venueForm.get('style.logoUrl')?.setValue('');
  }

  // ✅ NUEVO: Remover banner
  removeBanner(): void {
    this.selectedBanner = null;
    this.bannerPreview = null;
    this.venueForm.get('style.bannerUrl')?.setValue('');
  }

  saveChanges(): void {
    if (this.venueForm.invalid) {
      this.venueForm.markAllAsTouched();
      console.error('El formulario es inválido. Por favor, revisa los campos requeridos.');
      return;
    }

    this.loading = true;
    const formData = this.createFormData()

    // Construir el DTO de Request (FoodVenueRequestDto)
    // const updateDto: Partial<FoodVenueRequest> = {
    //   name: formValue.name,
    //   email: formValue.email,
    //   phone: formValue.phone,
    //   address: formValue.address,

    //   Enviamos el objeto style completo.
    //   styleRequestDto: formValue.style
   // };


    this.foodVenueService.updateMyCurrentFoodVenue(formData).subscribe({
      next: (response) => {
        console.log('Local actualizado con éxito', response);
        this.loading = false;
        this.isEditing = false;
        this.selectedLogo = null;
        this.selectedBanner = null;
        this.venueForm.disable();
         this.loadVenueData();
        // Aquí podrías mostrar una notificación de éxito
      },
      error: (err) => {
        console.error('Error al actualizar local', err);
        this.loading = false;
        // Aquí podrías mostrar un mensaje de error
      }
    });
  }

private createFormData(): FormData {
    const formData = new FormData();
    const formValues = this.venueForm.getRawValue(); // getRawValue incluye campos disabled

    // Construir el objeto venue
    const venueData: any = {
      name: formValues.name,
      email: formValues.email,
      phone: formValues.phone,
      address: formValues.address,
      styleRequestDto: {
        slogan: formValues.style.slogan || '',
        description: formValues.style.description || '',
        publicMenu: formValues.style.publicMenu,
        instagramUrl: formValues.style.instagramUrl || '',
        facebookUrl: formValues.style.facebookUrl || '',
        whatsappNumber: formValues.style.whatsappNumber || '',
        // ✅ Enviar URLs existentes si no se subieron nuevas imágenes
        logoUrl: formValues.style.logoUrl || '',
        bannerUrl: formValues.style.bannerUrl || ''
      }
    };

    // Agregar JSON del venue
    formData.append('venue', new Blob([JSON.stringify(venueData)], {
      type: 'application/json'
    }));

    // Agregar logo si se seleccionó uno nuevo
    if (this.selectedLogo) {
      formData.append('logo', this.selectedLogo);
    }

    // Agregar banner si se seleccionó uno nuevo
    if (this.selectedBanner) {
      formData.append('banner', this.selectedBanner);
    }

    return formData;
  }


}
