import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database/connection';

type IdAttrs = { id: string };
type Creation<T extends IdAttrs> = Partial<T>;

export class User extends Model<
  IdAttrs & {
    username: string;
    email: string;
    passwordHash: string;
    recoveryHash: string | null;
    recoveryExpiresAt: Date | null;
  },
  Creation<
    IdAttrs & {
      username: string;
      email: string;
      passwordHash: string;
      recoveryHash: string | null;
      recoveryExpiresAt: Date | null;
    }
  >
> {
  declare id: string;
  declare username: string;
  declare email: string;
  declare passwordHash: string;
  declare recoveryHash: string | null;
  declare recoveryExpiresAt: Date | null;
}
User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    username: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(254), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(100), allowNull: false },
    recoveryHash: DataTypes.STRING(64),
    recoveryExpiresAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'usuarios', underscored: true },
);

export class Legajo extends Model<
  IdAttrs & { numero: string },
  Creation<IdAttrs & { numero: string }>
> {
  declare id: string;
  declare numero: string;
}
Legajo.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    numero: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  },
  { sequelize, tableName: 'legajos', underscored: true },
);

export class Person extends Model<
  IdAttrs & {
    nombre: string;
    identificacion: string | null;
    domicilio: string | null;
    telefono: string | null;
    email: string | null;
    observaciones: string | null;
  },
  Creation<
    IdAttrs & {
      nombre: string;
      identificacion: string | null;
      domicilio: string | null;
      telefono: string | null;
      email: string | null;
      observaciones: string | null;
    }
  >
> {
  declare id: string;
  declare nombre: string;
  declare identificacion: string | null;
  declare domicilio: string | null;
  declare telefono: string | null;
  declare email: string | null;
  declare observaciones: string | null;
}
Person.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING(180), allowNull: false },
    identificacion: { type: DataTypes.STRING(40), unique: true },
    domicilio: DataTypes.STRING(300),
    telefono: DataTypes.STRING(40),
    email: DataTypes.STRING(254),
    observaciones: DataTypes.TEXT,
  },
  { sequelize, tableName: 'personas', underscored: true },
);

export class Category extends Model<
  IdAttrs & { nombre: string; parentId: string | null },
  Creation<IdAttrs & { nombre: string; parentId: string | null }>
> {
  declare id: string;
  declare nombre: string;
  declare parentId: string | null;
}
Category.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_id',
      references: { model: 'categorias', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'categorias',
    underscored: true,
    indexes: [{ unique: true, fields: ['nombre', 'parent_id'] }],
  },
);

export class Tag extends Model<
  IdAttrs & { nombre: string },
  Creation<IdAttrs & { nombre: string }>
> {
  declare id: string;
  declare nombre: string;
}
Tag.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  },
  { sequelize, tableName: 'etiquetas', underscored: true },
);

export class Priority extends Model<
  IdAttrs & { nombre: string; orden: number },
  Creation<IdAttrs & { nombre: string; orden: number }>
> {
  declare id: string;
  declare nombre: string;
  declare orden: number;
}
Priority.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING(60), allowNull: false },
    orden: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  },
  { sequelize, tableName: 'prioridades', underscored: true },
);

import { documentStates } from '../domain/document';
export type DocumentState = (typeof documentStates)[number];
export class DocumentRecord extends Model<
  IdAttrs & {
    titulo: string;
    numero: string | null;
    tipo: string;
    fechaEmision: Date | null;
    fechaIncorporacion: Date;
    descripcion: string | null;
    legajoId: string;
    prioridadId: string;
    estado: DocumentState;
  },
  Creation<
    IdAttrs & {
      titulo: string;
      numero: string | null;
      tipo: string;
      fechaEmision: Date | null;
      fechaIncorporacion: Date;
      descripcion: string | null;
      legajoId: string;
      prioridadId: string;
      estado: DocumentState;
    }
  >
> {
  declare id: string;
  declare titulo: string;
  declare numero: string | null;
  declare tipo: string;
  declare fechaEmision: Date | null;
  declare fechaIncorporacion: Date;
  declare descripcion: string | null;
  declare legajoId: string;
  declare prioridadId: string;
  declare estado: DocumentState;
}
DocumentRecord.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    titulo: { type: DataTypes.STRING(220), allowNull: false },
    numero: { type: DataTypes.STRING(80) },
    tipo: { type: DataTypes.STRING(80), allowNull: false },
    fechaEmision: { type: DataTypes.DATEONLY, field: 'fecha_emision' },
    fechaIncorporacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'fecha_incorporacion',
    },
    descripcion: DataTypes.TEXT,
    legajoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'legajo_id',
      references: { model: 'legajos', key: 'id' },
    },
    prioridadId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'prioridad_id',
      references: { model: 'prioridades', key: 'id' },
    },
    estado: {
      type: DataTypes.ENUM(...documentStates),
      allowNull: false,
      defaultValue: 'Pendiente',
    },
  },
  {
    sequelize,
    tableName: 'documentos',
    underscored: true,
    indexes: [{ fields: ['titulo'] }, { fields: ['numero'] }, { fields: ['fecha_incorporacion'] }],
  },
);

export class Attachment extends Model<
  IdAttrs & {
    documentId: string;
    storedName: string;
    originalName: string;
    mimeType: string;
    size: number;
  },
  Creation<
    IdAttrs & {
      documentId: string;
      storedName: string;
      originalName: string;
      mimeType: string;
      size: number;
    }
  >
> {
  declare id: string;
  declare documentId: string;
  declare storedName: string;
  declare originalName: string;
  declare mimeType: string;
  declare size: number;
}
Attachment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'document_id',
      references: { model: 'documentos', key: 'id' },
    },
    storedName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'stored_name',
    },
    originalName: { type: DataTypes.STRING(255), allowNull: false, field: 'original_name' },
    mimeType: { type: DataTypes.STRING(100), allowNull: false, field: 'mime_type' },
    size: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: 'archivos', underscored: true },
);

export const DocumentPerson = sequelize.define(
  'documento_persona',
  {
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'document_id',
      references: { model: 'documentos', key: 'id' },
    },
    personId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'persona_id',
      references: { model: 'personas', key: 'id' },
    },
    rol: { type: DataTypes.STRING(80), allowNull: false },
  },
  {
    tableName: 'documento_persona',
    underscored: true,
    timestamps: false,
    indexes: [{ unique: true, fields: ['document_id', 'persona_id'] }],
  },
);
export const DocumentCategory = sequelize.define(
  'documento_categoria',
  {
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'document_id',
      references: { model: 'documentos', key: 'id' },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'categoria_id',
      references: { model: 'categorias', key: 'id' },
    },
  },
  {
    tableName: 'documento_categoria',
    underscored: true,
    timestamps: false,
    indexes: [{ unique: true, fields: ['document_id', 'categoria_id'] }],
  },
);
export const DocumentTag = sequelize.define(
  'documento_etiqueta',
  {
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'document_id',
      references: { model: 'documentos', key: 'id' },
    },
    tagId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'etiqueta_id',
      references: { model: 'etiquetas', key: 'id' },
    },
  },
  {
    tableName: 'documento_etiqueta',
    underscored: true,
    timestamps: false,
    indexes: [{ unique: true, fields: ['document_id', 'etiqueta_id'] }],
  },
);

Legajo.hasMany(DocumentRecord, { foreignKey: 'legajoId', onDelete: 'CASCADE', as: 'documentos' });
DocumentRecord.belongsTo(Legajo, { foreignKey: 'legajoId', as: 'legajo' });
Priority.hasMany(DocumentRecord, { foreignKey: 'prioridadId', as: 'documentos' });
DocumentRecord.belongsTo(Priority, { foreignKey: 'prioridadId', as: 'prioridad' });
DocumentRecord.hasMany(Attachment, {
  foreignKey: 'documentId',
  onDelete: 'CASCADE',
  as: 'archivos',
});
Attachment.belongsTo(DocumentRecord, { foreignKey: 'documentId', as: 'documento' });
Category.hasMany(Category, { foreignKey: 'parentId', as: 'subcategorias' });
Category.belongsTo(Category, { foreignKey: 'parentId', as: 'categoriaPadre' });
DocumentRecord.belongsToMany(Person, {
  through: DocumentPerson,
  foreignKey: 'documentId',
  otherKey: 'personId',
  as: 'personas',
});
Person.belongsToMany(DocumentRecord, {
  through: DocumentPerson,
  foreignKey: 'personId',
  otherKey: 'documentId',
  as: 'documentos',
});
DocumentRecord.belongsToMany(Category, {
  through: DocumentCategory,
  foreignKey: 'documentId',
  otherKey: 'categoryId',
  as: 'categorias',
});
Category.belongsToMany(DocumentRecord, {
  through: DocumentCategory,
  foreignKey: 'categoryId',
  otherKey: 'documentId',
  as: 'documentos',
});
DocumentRecord.belongsToMany(Tag, {
  through: DocumentTag,
  foreignKey: 'documentId',
  otherKey: 'tagId',
  as: 'etiquetas',
});
Tag.belongsToMany(DocumentRecord, {
  through: DocumentTag,
  foreignKey: 'tagId',
  otherKey: 'documentId',
  as: 'documentos',
});
