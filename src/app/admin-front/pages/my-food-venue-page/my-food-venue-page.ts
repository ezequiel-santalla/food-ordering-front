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

      // Bloque: Todos los campos de Estilo (Branding, Imágenes, Redes y Colores)
      style: this.fb.group({
        // Branding (Slogan y Descripción)
        slogan: ['', [Validators.maxLength(200)]],
        description: ['', [Validators.maxLength(1000)]],
        publicMenu: [false], // Toggle Switch

        // Paleta de Colores (Inicializados con valores predeterminados)
        primaryColor: ['#3b82f6'],
        secondaryColor: ['#8b5cf6'],
        accentColor: ['#f59e0b'],
        backgroundColor: ['#ffffff'],
        textColor: ['#000000'],

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

  // loadVenueData(): void {
  //   this.loading = true;
  //   this.foodVenueService.getMyFoodVenue().subscribe({
  //     next: (data: FoodVenueAdminResponse) => {
  //       // Mapear la respuesta del backend al formulario
  //       this.venueForm.patchValue({
  //         name: data.name,
  //         email: data.email,
  //         phone: data.phone,
  //         address: data.address,
  //         style: data.style // Mapea TODO el objeto style (slogan, colores, redes, etc.)
  //       });
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('Error al cargar datos del local', err);
  //       this.loading = false;
  //       // Considerar deshabilitar el formulario o mostrar un error.
  //     }
  //   });
  // }
loadVenueData(): void {
  this.loading = true;
  this.foodVenueService.getMyFoodVenue().subscribe({
    next: (data: FoodVenueAdminResponse) => {

      // 1. Carga de campos principales (está bien)
      this.venueForm.patchValue({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address
      });

      // 2. Carga del grupo 'style' usando 'venueStyle'
      const styleGroup = this.venueForm.get('style') as FormGroup;
      // Usamos data.venueStyle para obtener la información del estilo
      const styleData = data.venueStyle;

      if (styleGroup && styleData) { // Verificamos que styleData exista
        styleGroup.patchValue({
          // Redes Sociales
          instagramUrl: styleData.instagramUrl ?? '',
          facebookUrl: styleData.facebookUrl ?? '',
          whatsappNumber: styleData.whatsappNumber ?? '',
          // Branding
          slogan: styleData.slogan ?? '',
          description: styleData.description ?? '',
          publicMenu: styleData.publicMenu ?? false,
          // Colores (usamos el OR lógico para mantener los valores por defecto si el BE no los envía)
          primaryColor: styleData.primaryColor ?? '#3b82f6',
          secondaryColor: styleData.secondaryColor ?? '#8b5cf6',
          accentColor: styleData.accentColor ?? '#f59e0b',
          backgroundColor: styleData.backgroundColor ?? '#ffffff',
          textColor: styleData.textColor ?? '#000000',
          // Imágenes
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
