import { Component } from '@angular/core';
import TagResponse from '../../models/response/tag-response';
import { TagService } from '../../services/tag-service';
import { Subcategory } from '../../../store-front/models/menu.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tag-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './tag-page.html'
})
export class TagPage {

  isCreatingNewTag: boolean = false;


  availableTags: TagResponse[] = [];
  newTagLabel: string = '';


  isLoading: boolean = true;

 constructor (private tagService: TagService) {}




ngOnInit(): void {
    this.loadTags();
  }

  loadTags(): void {
    this.isLoading = true;
    this.tagService.getTags().subscribe({
      next: (tags) => {
        this.availableTags = tags.sort((a, b) => a.label.localeCompare(b.label));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar los tags:', err);
        this.isLoading = false;
      }
    });
  }


  switchToCreate(): void {
    this.isCreatingNewTag = true;
    this.newTagLabel = '';
  }


  switchToTagsList(): void {
    this.isCreatingNewTag = false;
    this.newTagLabel = '';
  }


  createNewTag(): void {
    const trimmedLabel = this.newTagLabel.trim();


    if (!trimmedLabel) {
      alert('El nombre del Tag no puede estar vacío.');
      return;
    }


    this.isLoading = true;

    this.tagService.createTag({ label: trimmedLabel }).subscribe({
      next: (newTag) => {
        console.log(`Tag creado exitosamente: ${newTag.label}`);

        this.availableTags.push(newTag);
        this.availableTags.sort((a, b) => a.label.localeCompare(b.label));
        this.isLoading = false;
        // this.loadTags();
        this.switchToTagsList();
      },
      error: (err) => {
        console.error('Error al crear el tag:', err);
        this.isLoading = false;
        alert(`No se pudo crear el Tag. Error: ${err.message || 'Desconocido'}`);
      }
    });
  }
}

