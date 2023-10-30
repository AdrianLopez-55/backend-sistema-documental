import { Injectable } from '@nestjs/common';
import { CreateEstadoUbicacionDto } from './dto/create-estado-ubicacion.dto';
import { UpdateEstadoUbicacionDto } from './dto/update-estado-ubicacion.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  EstadoUbiacion,
  EstadoUbiacionDocument,
} from './schema/estado-ubicacion.schema';
import { Model } from 'mongoose';
import { EstadoUbicacionFilter } from './dto/filter.dto';
import { PaginationDto } from 'src/common/pagination.dto';

@Injectable()
export class EstadoUbicacionService {
  private defaultLimit: number;
  constructor(
    @InjectModel(EstadoUbiacion.name)
    private readonly estadoUbicacionModel: Model<EstadoUbiacionDocument>,
  ) {}
  async findAll() {
    return await this.estadoUbicacionModel.find().exec();
  }

  async findOne(id: string) {
    return await this.estadoUbicacionModel.findById(id).exec();
  }

  async getUbicationState(
    filter: EstadoUbicacionFilter,
    paginationDto: PaginationDto,
  ) {
    const allEstadoUbicacion = await this.estadoUbicacionModel.find().exec();
    const { limit = this.defaultLimit, page = 1 } = paginationDto;
    const offset = (page - 1) * limit;

    const filteredEstadoUbicacion = allEstadoUbicacion.filter((eu) => {
      return (
        (!filter.idDocument || eu.idDocument === filter.idDocument) &&
        (!filter.office ||
          eu.estado_ubi.some((office) =>
            office.nameOffices.some((nameOffice) =>
              nameOffice.office.match(new RegExp(filter.office, 'i')),
            ),
          )) &&
        (!filter.stateOffice ||
          eu.estado_ubi.some((office) =>
            office.stateOffice.match(new RegExp(filter.stateOffice, 'i')),
          )) &&
        (!filter.numberPasoOffice ||
          eu.estado_ubi.some(
            (office) => office.numberPasoOffice === filter.numberPasoOffice,
          )) &&
        (!filter.ciUser ||
          eu.estado_ubi.some((office) =>
            office.receivedUsers.some((user) =>
              user.ciUser.match(new RegExp(filter.ciUser, 'i')),
            ),
          )) &&
        (!filter.idOfUser ||
          eu.estado_ubi.some((office) =>
            office.receivedUsers.some((user) =>
              user.idOfUser.match(new RegExp(filter.idOfUser, 'i')),
            ),
          )) &&
        (!filter.nameOfficeUserRecieved ||
          eu.estado_ubi.some((office) =>
            office.receivedUsers.some((user) =>
              user.nameOfficeUserRecieved.match(
                new RegExp(filter.nameOfficeUserRecieved, 'i'),
              ),
            ),
          )) &&
        (!filter.dateRecived ||
          eu.estado_ubi.some((office) =>
            office.receivedUsers.some((user) => {
              // Verificar si filter.dateRecived es una instancia de Date
              if (filter.dateRecived instanceof Date) {
                return (
                  user.dateRecived &&
                  user.dateRecived.getTime() === filter.dateRecived.getTime()
                );
              }
              return false;
            }),
          )) &&
        (!filter.stateDocumentUser ||
          eu.estado_ubi.some((office) =>
            office.receivedUsers.some((user) =>
              user.stateDocumentUser.match(
                new RegExp(filter.stateDocumentUser, 'i'),
              ),
            ),
          )) &&
        (!filter.observado ||
          eu.estado_ubi.some((office) =>
            office.receivedUsers.some(
              (user) => user.observado === filter.observado,
            ),
          ))
      );
    });

    filteredEstadoUbicacion.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = filteredEstadoUbicacion.length;
    const paginateEstadoUbicacion = filteredEstadoUbicacion.slice(
      offset,
      offset + limit,
    );
    const totalPages = Math.ceil(total / limit);

    return {
      estadoUbicacion: paginateEstadoUbicacion,
      total,
      totalPages,
    };
  }
}

/*
  async findAllEstadoUbicacion(
    filter: EstadoUbicacionFilter,
    paginationDto: PaginationDto,
  ) {
    const allEstadoUbicacion = await this.estadoUbicacionModel.find().exec();
    const { limit = this.defaultLimit, page = 1 } = paginationDto;
    const offset = (page - 1) * limit;

    const filteredEstadoUbicacion = allEstadoUbicacion.filter((eu) => {
      return (
        (!filter.idDocument || eu.idDocument === filter.idDocument) &&
        (!filter.office ||
          eu.estado_ubi.some((office) =>
            office.nameOffices.some((nameOffice) =>
              nameOffice.office.match(new RegExp(filter.office, 'i')),
            ),
          )) &&
        (!filter.stateOffice ||
          eu.estado_ubi.some((office) =>
            office.stateOffice.match(new RegExp(filter.stateOffice, 'i')),
          )) &&
        (!filter.numberPasoOffice ||
          eu.estado_ubi.some(
            (office) => office.numberPasoOffice === filter.numberPasoOffice,
          )) &&
        (!filter.ciUser ||
          eu.estado_ubi.some((office) =>
            office.receivedUsers.some((user) =>
              user.ciUser.match(new RegExp(filter.ciUser, 'i')),
            ),
          )) &&
        (!filter.idOfUser ||
          eu.estado_ubi.some((office) =>
            office.receivedUsers.some((user) =>
              user.idOfUser.match(new RegExp(filter.idOfUser, 'i')),
            ),
          )) &&
        (!filter.nameOfficeUserRecieved ||
          eu.estado_ubi.some((office) =>
            office.receivedUsers.some((user) =>
              user.nameOfficeUserRecieved.match(
                new RegExp(filter.nameOfficeUserRecieved, 'i'),
              ),
            ),
          )) &&
        (!filter.dateRecived ||
          eu.estado_ubi.some((office) =>
            office.receivedUsers.some(
              (user) => user.dateRecived === filter.dateRecived,
            ),
          )) &&
        (!filter.stateDocumentUser ||
          eu.estado_ubi.some((office) =>
            office.receivedUsers.some((user) =>
              user.stateDocumentUser.match(
                new RegExp(filter.stateDocumentUser, 'i'),
              ),
            ),
          )) &&
        (!filter.observado ||
          eu.estado_ubi.some((office) =>
            office.receivedUsers.some(
              (user) => user.observado === filter.observado,
            ),
          ))
      );
    });

    filteredEstadoUbicacion.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = filteredEstadoUbicacion.length;
    const paginateEstadoUbicacion = filteredEstadoUbicacion.slice(
      offset,
      offset + limit,
    );
    const totalPages = Math.ceil(total / limit);

    return {
      estadoUbicacion: paginateEstadoUbicacion,
      total,
      totalPages,
    };

    /*
    const allEstadoUbicacion = await this.estadoUbicacionModel.find().exec();
    const { limit = this.defaultLimit, page = 1 } = paginationDto;
    const offset = (page - 1) * limit;
    let filteredEstadoUbicacion = allEstadoUbicacion;
    if (filter.idDocument) {
      filteredEstadoUbicacion = filteredEstadoUbicacion.filter(
        (estadoUbicacion) => {
          return estadoUbicacion.idDocument === filter.idDocument;
        },
      );
    }

    if (filter.office) {
      const officeSearchRegex = new RegExp(filter.office, 'i');
      filteredEstadoUbicacion = filteredEstadoUbicacion.filter((eu) => {
        if (eu.estado_ubi) {
          eu.estado_ubi.filter((eu) => {
            if (eu.nameOffices)
              eu.nameOffices.filter((eu) => {
                if (eu.office) {
                  return officeSearchRegex.test(eu.office);
                }
              });
          });
        }
      });
    }

    if (filter.stateOffice) {
      const stateOfficeSearchRegex = new RegExp(filter.stateOffice, 'i');
      filteredEstadoUbicacion = filteredEstadoUbicacion.filter((eu) => {
        if (eu.estado_ubi) {
          eu.estado_ubi.filter((eu) => {
            if (eu.stateOffice) {
              return stateOfficeSearchRegex.test(eu.stateOffice);
            }
          });
        }
      });
    }

    if (filter.numberPasoOffice) {
      filteredEstadoUbicacion = filteredEstadoUbicacion.filter((eu) => {
        if (eu.estado_ubi) {
          eu.estado_ubi.filter((eu) => {
            if (eu.stateOffice) {
              return eu.numberPasoOffice === filter.numberPasoOffice;
            }
          });
        }
      });
    }

    if (filter.ciUser) {
      const ciUserSearchRegex = new RegExp(filter.ciUser, 'i');
      filteredEstadoUbicacion = filteredEstadoUbicacion.filter((eu) => {
        if (eu.estado_ubi) {
          eu.estado_ubi.filter((eu) => {
            if (eu.receivedUsers)
              eu.receivedUsers.filter((eu) => {
                if (eu.ciUser) {
                  return ciUserSearchRegex.test(eu.ciUser);
                }
              });
          });
        }
      });
    }

    if (filter.idOfUser) {
      const idOfUserSearchRegex = new RegExp(filter.idOfUser, 'i');
      filteredEstadoUbicacion = filteredEstadoUbicacion.filter((eu) => {
        if (eu.estado_ubi) {
          eu.estado_ubi.filter((eu) => {
            if (eu.receivedUsers)
              eu.receivedUsers.filter((eu) => {
                if (eu.idOfUser) {
                  return idOfUserSearchRegex.test(eu.idOfUser);
                }
              });
          });
        }
      });
    }

    if (filter.nameOfficeUserRecieved) {
      const nameOfficeUserRecievedSearchRegex = new RegExp(
        filter.nameOfficeUserRecieved,
        'i',
      );
      filteredEstadoUbicacion = filteredEstadoUbicacion.filter((eu) => {
        if (eu.estado_ubi) {
          eu.estado_ubi.filter((eu) => {
            if (eu.receivedUsers)
              eu.receivedUsers.filter((eu) => {
                if (eu.nameOfficeUserRecieved) {
                  return nameOfficeUserRecievedSearchRegex.test(
                    eu.nameOfficeUserRecieved,
                  );
                }
              });
          });
        }
      });
    }

    if (filter.dateRecived) {
      // const ciUserSearchRegex = new RegExp(filter.ciUser, 'i');
      filteredEstadoUbicacion = filteredEstadoUbicacion.filter((eu) => {
        if (eu.estado_ubi) {
          eu.estado_ubi.filter((eu) => {
            if (eu.receivedUsers)
              eu.receivedUsers.filter((eu) => {
                if (eu.dateRecived) {
                  return eu.dateRecived === filter.dateRecived;
                }
              });
          });
        }
      });
    }

    if (filter.stateDocumentUser) {
      const stateDocumentUserSearchRegex = new RegExp(
        filter.stateDocumentUser,
        'i',
      );
      filteredEstadoUbicacion = filteredEstadoUbicacion.filter((eu) => {
        if (eu.estado_ubi) {
          eu.estado_ubi.filter((eu) => {
            if (eu.receivedUsers)
              eu.receivedUsers.filter((eu) => {
                if (eu.stateDocumentUser) {
                  return stateDocumentUserSearchRegex.test(
                    eu.stateDocumentUser,
                  );
                }
              });
          });
        }
      });
    }

    if (filter.observado) {
      // const ciUserSearchRegex = new RegExp(filter.ciUser, 'i');
      filteredEstadoUbicacion = filteredEstadoUbicacion.filter((eu) => {
        if (eu.estado_ubi) {
          eu.estado_ubi.filter((eu) => {
            if (eu.receivedUsers)
              eu.receivedUsers.filter((eu) => {
                if (eu.observado) {
                  return eu.observado === filter.observado;
                }
              });
          });
        }
      });
    }

    filteredEstadoUbicacion.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const total = filteredEstadoUbicacion.length;
    const paginateEstadoUbicacion = filteredEstadoUbicacion.slice(
      offset,
      offset + limit,
    );
    const totalPages = Math.ceil(total / limit);
    return {
      estadoUbicacion: paginateEstadoUbicacion,
      total,
      totalPages,
    };
  }

  
  }
}
*/
