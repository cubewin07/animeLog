import logging
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
from .models import Image

logger = logging.getLogger(__name__)


@receiver(post_delete, sender=Image)
def delete_file_on_image_delete(sender, instance, **kwargs):
    """
    Deletes the remote asset from Cloudinary when the Image model record is deleted.
    """
    if instance.file:
        try:
            instance.file.delete(save=False)
        except Exception as err:
            logger.warning(
                "Failed to delete Cloudinary file %s for Image #%s: %s",
                instance.file.name,
                instance.id,
                err,
            )


@receiver(pre_save, sender=Image)
def delete_old_file_on_image_update(sender, instance, **kwargs):
    """
    Deletes the old asset from Cloudinary when an existing Image record is updated with a new file.
    """
    if not instance.pk:
        return

    try:
        old_image = Image.objects.get(pk=instance.pk)
    except Image.DoesNotExist:
        return

    if old_image.file and old_image.file != instance.file:
        try:
            old_image.file.delete(save=False)
        except Exception as err:
            logger.warning(
                "Failed to delete old Cloudinary file %s for Image #%s: %s",
                old_image.file.name,
                instance.id,
                err,
            )
