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
      }

      this.loading = false;
    },
    error: (err) => {
      console.error('Error al cargar datos del local', err);
      this.loading = false;
    }
  });
}

  saveChanges(): void {
    if (this.venueForm.invalid) {
      this.venueForm.markAllAsTouched();
      console.error('El formulario es inválido. Por favor, revisa los campos requeridos.');
      return;
    }

    this.loading = true;
    const formValue = this.venueForm.value;

    // Construir el DTO de Request (FoodVenueRequestDto)
    const updateDto: Partial<FoodVenueRequest> = {
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone,
      address: formValue.address,

      // Enviamos el objeto style completo.
      styleRequestDto: formValue.style
    };

    this.foodVenueService.updateMyCurrentFoodVenue(updateDto).subscribe({
      next: (response) => {
        console.log('Local actualizado con éxito', response);
        this.loading = false;
        // Aquí podrías mostrar una notificación de éxito
      },
      error: (err) => {
        console.error('Error al actualizar local', err);
        this.loading = false;
        // Aquí podrías mostrar un mensaje de error
      }
    });
  }
}
