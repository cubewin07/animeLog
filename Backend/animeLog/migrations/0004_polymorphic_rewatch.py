# Generated for Polymorphic Generic Rewatch with Data Migration

import django.db.models.deletion
from django.db import migrations, models


def migrate_existing_rewatches(apps, schema_editor):
    Rewatch = apps.get_model('animeLog', 'Rewatch')
    ContentType = apps.get_model('contenttypes', 'ContentType')

    season_ct, _ = ContentType.objects.get_or_create(app_label='animeLog', model='animeseason')
    movie_ct, _ = ContentType.objects.get_or_create(app_label='animeLog', model='animemovie')

    for r in Rewatch.objects.all():
        if getattr(r, 'season_id', None):
            r.content_type = season_ct
            r.object_id = r.season_id
            r.save(update_fields=['content_type', 'object_id'])
        elif getattr(r, 'movie_id', None):
            r.content_type = movie_ct
            r.object_id = r.movie_id
            r.save(update_fields=['content_type', 'object_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('animeLog', '0003_folder_image_animemovie_cover_image_and_more'),
    ]

    operations = [
        # 1. Add nullable content_type and object_id
        migrations.AddField(
            model_name='rewatch',
            name='content_type',
            field=models.ForeignKey(
                null=True,
                limit_choices_to=models.Q(
                    app_label='animeLog',
                    model__in=['animeseries', 'animeseason', 'animemovie', 'episodenote']
                ),
                on_delete=django.db.models.deletion.CASCADE,
                to='contenttypes.contenttype',
            ),
        ),
        migrations.AddField(
            model_name='rewatch',
            name='object_id',
            field=models.PositiveIntegerField(null=True),
        ),
        # 2. Migrate existing data from season/movie to content_type/object_id
        migrations.RunPython(migrate_existing_rewatches, migrations.RunPython.noop),
        # 3. Alter content_type and object_id to null=False
        migrations.AlterField(
            model_name='rewatch',
            name='content_type',
            field=models.ForeignKey(
                limit_choices_to=models.Q(
                    app_label='animeLog',
                    model__in=['animeseries', 'animeseason', 'animemovie', 'episodenote']
                ),
                on_delete=django.db.models.deletion.CASCADE,
                to='contenttypes.contenttype',
            ),
        ),
        migrations.AlterField(
            model_name='rewatch',
            name='object_id',
            field=models.PositiveIntegerField(),
        ),
        # 4. Remove old constraint and fields
        migrations.RemoveConstraint(
            model_name='rewatch',
            name='rewatch_exactly_one_target',
        ),
        migrations.RemoveField(
            model_name='rewatch',
            name='season',
        ),
        migrations.RemoveField(
            model_name='rewatch',
            name='movie',
        ),
        # 5. Add index
        migrations.AddIndex(
            model_name='rewatch',
            index=models.Index(fields=['content_type', 'object_id'], name='animeLog_re_content_73926f_idx'),
        ),
    ]
